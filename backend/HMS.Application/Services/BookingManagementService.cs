// Author: Salaams
using AutoMapper;
using HMS.Application.BusinessRules;
using HMS.Application.DTOs.Bookings;
using HMS.Application.Interfaces.Repositories;
using HMS.Application.Interfaces.Services;
using HMS.Domain.Entities;
using HMS.Domain.Enums;

namespace HMS.Application.Services;

/// <summary>
/// Handles the full booking lifecycle with business-rule enforcement:
///   Create  — availability guard, peak/off-peak pricing, total calculation
///   Cancel  — spec cancellation-fee policy (>14 days free, 3–14 days 50%, &lt;72 h 100%)
///   CheckIn — pre-authorises payment for the estimated total
///   CheckOut — finalises bill (rooms + services + 20% VAT), generates invoice, captures payment
/// </summary>
public class BookingManagementService : IBookingService
{
    private const decimal VatRate = 0.20m;

    private readonly IBookingRepository          _bookings;
    private readonly IRoomRepository             _rooms;
    private readonly IAncillaryServiceRepository _services;
    private readonly IPaymentRepository          _payments;
    private readonly IInvoiceRepository          _invoices;
    private readonly IMapper                     _mapper;

    public BookingManagementService(
        IBookingRepository          bookings,
        IRoomRepository             rooms,
        IAncillaryServiceRepository services,
        IPaymentRepository          payments,
        IInvoiceRepository          invoices,
        IMapper                     mapper)
    {
        _bookings = bookings;
        _rooms    = rooms;
        _services = services;
        _payments = payments;
        _invoices = invoices;
        _mapper   = mapper;
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    public async Task<BookingDto?> GetBookingByIdAsync(int id)
    {
        var booking = await _bookings.GetByIdWithDetailsAsync(id);
        return booking is null ? null : _mapper.Map<BookingDto>(booking);
    }

    public async Task<IEnumerable<BookingDto>> GetBookingsByGuestAsync(int guestId)
    {
        var bookings = await _bookings.GetByGuestIdAsync(guestId);
        return _mapper.Map<IEnumerable<BookingDto>>(bookings);
    }

    public async Task<IEnumerable<BookingDto>> GetBookingsByHotelAsync(int hotelId)
    {
        var bookings = await _bookings.GetByHotelIdAsync(hotelId);
        return _mapper.Map<IEnumerable<BookingDto>>(bookings);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    /// <summary>
    /// Creates a confirmed booking.
    /// Validates availability, applies peak/off-peak pricing, and calculates the total.
    /// </summary>
    public async Task<BookingDto> CreateBookingAsync(int guestId, CreateBookingDto dto)
    {
        if (dto.CheckInDate.Date < DateTime.UtcNow.Date)
            throw new InvalidOperationException("Check-in date cannot be in the past.");

        if (dto.CheckOutDate.Date <= dto.CheckInDate.Date)
            throw new InvalidOperationException("Check-out date must be after check-in date.");

        if (!dto.RoomIds.Any())
            throw new InvalidOperationException("At least one room must be selected.");

        if (dto.GuestCount < 1)
            throw new InvalidOperationException("Guest count must be at least 1.");

        var nights = (dto.CheckOutDate.Date - dto.CheckInDate.Date).Days;

        // ── Availability guard ────────────────────────────────────────────────
        var availableRooms = (await _rooms.GetAvailableRoomsAsync(
            dto.HotelId, dto.CheckInDate, dto.CheckOutDate))
            .ToDictionary(r => r.Id);

        foreach (var roomId in dto.RoomIds)
        {
            if (!availableRooms.ContainsKey(roomId))
                throw new InvalidOperationException(
                    $"Room {roomId} is not available for the requested dates.");
        }

        var totalCapacity = dto.RoomIds.Sum(id => availableRooms[id].Capacity);
        if (dto.GuestCount > totalCapacity)
            throw new InvalidOperationException(
                $"Guest count ({dto.GuestCount}) exceeds the total capacity ({totalCapacity}) of the selected room(s).");

        // ── Build booking ─────────────────────────────────────────────────────
        var booking = new Booking
        {
            GuestId      = guestId,
            HotelId      = dto.HotelId,
            CheckInDate  = dto.CheckInDate.Date,
            CheckOutDate = dto.CheckOutDate.Date,
            Status       = BookingStatus.Confirmed,
            Notes        = dto.Notes,
            GuestCount   = dto.GuestCount,
            CreatedAt    = DateTime.UtcNow,
        };

        decimal roomTotal = 0m;

        foreach (var roomId in dto.RoomIds)
        {
            var room          = availableRooms[roomId];
            var nightlyRate   = PricingPolicy.GetNightlyRate(room, dto.CheckInDate);
            var roomSubtotal  = nightlyRate * nights;

            booking.BookingRooms.Add(new BookingRoom
            {
                RoomId         = roomId,
                PriceAtBooking = nightlyRate,
            });

            roomTotal += roomSubtotal;
        }

        decimal serviceTotal = 0m;

        foreach (var svcRequest in dto.Services)
        {
            if (svcRequest.Quantity < 1)
                throw new InvalidOperationException("Service quantity must be at least 1.");

            if (svcRequest.ServiceDate.Date < dto.CheckInDate.Date ||
                svcRequest.ServiceDate.Date >= dto.CheckOutDate.Date)
                throw new InvalidOperationException(
                    "Service date must fall within the booking dates.");

            var svc      = await _services.GetByIdAsync(svcRequest.ServiceId)
                ?? throw new KeyNotFoundException($"Service {svcRequest.ServiceId} not found.");
            var totalFee = svc.Fee * svcRequest.Quantity;

            booking.BookingServices.Add(new()
            {
                ServiceId   = svcRequest.ServiceId,
                Quantity    = svcRequest.Quantity,
                ServiceDate = svcRequest.ServiceDate,
                TotalFee    = totalFee,
            });

            serviceTotal += totalFee;
        }

        booking.TotalAmount = roomTotal + serviceTotal;

        await _bookings.AddAsync(booking);

        var created = await _bookings.GetByIdWithDetailsAsync(booking.Id)
            ?? throw new InvalidOperationException("Booking not found after creation.");
        return _mapper.Map<BookingDto>(created);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    /// <summary>
    /// Updates a Pending or Confirmed booking's dates, rooms, guest count and notes.
    /// Re-validates room availability (excluding the current booking) and recalculates the total.
    /// </summary>
    public async Task<BookingDto> UpdateBookingAsync(int bookingId, UpdateBookingDto dto, int requestingUserId)
    {
        var booking = await _bookings.GetByIdWithDetailsAsync(bookingId)
            ?? throw new KeyNotFoundException($"Booking {bookingId} not found.");

        // Guests may only edit their own bookings; staff (requestingUserId == 0) can edit any.
        if (requestingUserId != 0 && booking.GuestId != requestingUserId)
            throw new UnauthorizedAccessException("You may only edit your own bookings.");

        if (booking.Status is not (BookingStatus.Pending or BookingStatus.Confirmed))
            throw new InvalidOperationException(
                "Only Pending or Confirmed bookings can be modified.");

        if (dto.CheckInDate.Date < DateTime.UtcNow.Date)
            throw new InvalidOperationException("Check-in date cannot be in the past.");

        if (dto.CheckOutDate.Date <= dto.CheckInDate.Date)
            throw new InvalidOperationException("Check-out date must be after check-in date.");

        if (!dto.RoomIds.Any())
            throw new InvalidOperationException("At least one room must be selected.");

        if (dto.GuestCount < 1)
            throw new InvalidOperationException("Guest count must be at least 1.");

        var nights = (dto.CheckOutDate.Date - dto.CheckInDate.Date).Days;

        // ── Availability guard (exclude current booking's own rooms) ──────────
        var availableRooms = (await _rooms.GetAvailableRoomsAsync(
            booking.HotelId, dto.CheckInDate, dto.CheckOutDate))
            .ToDictionary(r => r.Id);

        // Rooms already in this booking are always re-selectable (they are pre-loaded)
        foreach (var br in booking.BookingRooms)
        {
            if (br.Room is not null)
                availableRooms.TryAdd(br.RoomId, br.Room);
        }

        foreach (var roomId in dto.RoomIds)
        {
            if (!availableRooms.ContainsKey(roomId))
                throw new InvalidOperationException(
                    $"Room {roomId} is not available for the requested dates.");
        }

        var totalCapacity = dto.RoomIds.Sum(id => availableRooms[id].Capacity);
        if (dto.GuestCount > totalCapacity)
            throw new InvalidOperationException(
                $"Guest count ({dto.GuestCount}) exceeds the total capacity ({totalCapacity}) of the selected room(s).");

        // ── Rebuild booking rooms ─────────────────────────────────────────────
        booking.BookingRooms.Clear();
        decimal roomTotal = 0m;

        foreach (var roomId in dto.RoomIds)
        {
            var room         = availableRooms[roomId];
            var nightlyRate  = PricingPolicy.GetNightlyRate(room, dto.CheckInDate);
            var roomSubtotal = nightlyRate * nights;

            booking.BookingRooms.Add(new BookingRoom
            {
                RoomId         = roomId,
                PriceAtBooking = nightlyRate,
            });

            roomTotal += roomSubtotal;
        }

        // Keep existing services but recalculate subtotal contribution
        decimal serviceTotal = booking.BookingServices.Sum(bs => bs.TotalFee);

        booking.CheckInDate  = dto.CheckInDate.Date;
        booking.CheckOutDate = dto.CheckOutDate.Date;
        booking.GuestCount   = dto.GuestCount;
        booking.Notes        = dto.Notes;
        booking.TotalAmount  = roomTotal + serviceTotal;

        await _bookings.UpdateAsync(booking);

        var updated = await _bookings.GetByIdWithDetailsAsync(bookingId)
            ?? throw new InvalidOperationException("Booking not found after update.");
        return _mapper.Map<BookingDto>(updated);
    }

    // ── Add Service ───────────────────────────────────────────────────────────

    /// <summary>
    /// Adds an ancillary service to a Confirmed booking.
    /// Guests may only modify their own bookings; staff bypass ownership.
    /// </summary>
    public async Task<BookingDto> AddServiceAsync(int bookingId, AddBookingServiceDto dto, int requestingUserId)
    {
        var booking = await _bookings.GetByIdWithDetailsAsync(bookingId)
            ?? throw new KeyNotFoundException($"Booking {bookingId} not found.");

        if (requestingUserId != 0 && booking.GuestId != requestingUserId)
            throw new UnauthorizedAccessException("You may only modify your own bookings.");

        if (booking.Status != BookingStatus.Confirmed)
            throw new InvalidOperationException("Services can only be added to Confirmed bookings.");

        if (dto.ServiceDate.Date < booking.CheckInDate.Date ||
            dto.ServiceDate.Date >= booking.CheckOutDate.Date)
            throw new InvalidOperationException("Service date must fall within the booking dates.");

        var svc = await _services.GetByIdAsync(dto.ServiceId)
            ?? throw new KeyNotFoundException($"Service {dto.ServiceId} not found.");

        var totalFee = svc.Fee * dto.Quantity;

        booking.BookingServices.Add(new BookingService
        {
            ServiceId   = dto.ServiceId,
            Quantity    = dto.Quantity,
            ServiceDate = dto.ServiceDate,
            TotalFee    = totalFee,
        });
        booking.TotalAmount += totalFee;

        await _bookings.UpdateAsync(booking);

        var updated = await _bookings.GetByIdWithDetailsAsync(bookingId)!;
        return _mapper.Map<BookingDto>(updated!);
    }

    // ── Remove Service ────────────────────────────────────────────────────────

    /// <summary>
    /// Removes an ancillary service from a Confirmed booking.
    /// </summary>
    public async Task<BookingDto> RemoveServiceAsync(int bookingId, int serviceId, int requestingUserId)
    {
        var booking = await _bookings.GetByIdWithDetailsAsync(bookingId)
            ?? throw new KeyNotFoundException($"Booking {bookingId} not found.");

        if (requestingUserId != 0 && booking.GuestId != requestingUserId)
            throw new UnauthorizedAccessException("You may only modify your own bookings.");

        if (booking.Status != BookingStatus.Confirmed)
            throw new InvalidOperationException("Services can only be removed from Confirmed bookings.");

        var entry = booking.BookingServices.FirstOrDefault(bs => bs.ServiceId == serviceId)
            ?? throw new KeyNotFoundException($"Service {serviceId} is not on this booking.");

        booking.TotalAmount -= entry.TotalFee;
        booking.BookingServices.Remove(entry);

        await _bookings.UpdateAsync(booking);

        var updated = await _bookings.GetByIdWithDetailsAsync(bookingId)!;
        return _mapper.Map<BookingDto>(updated!);
    }

    // ── Cancel ────────────────────────────────────────────────────────────────

    /// <summary>
    /// Cancels a booking and applies the spec cancellation-fee policy.
    /// </summary>
    public async Task<BookingDto> CancelBookingAsync(int bookingId, int requestingUserId)
    {
        var booking = await _bookings.GetByIdWithDetailsAsync(bookingId)
            ?? throw new KeyNotFoundException($"Booking {bookingId} not found.");

        // requestingUserId == 0 means the caller is staff/admin (ownership check skipped)
        if (requestingUserId != 0 && booking.GuestId != requestingUserId)
            throw new UnauthorizedAccessException("You may only cancel your own bookings.");

        if (booking.Status is BookingStatus.CheckedIn or BookingStatus.CheckedOut)
            throw new InvalidOperationException(
                "Cannot cancel a booking that has already checked in or checked out.");

        if (booking.Status == BookingStatus.Cancelled)
            throw new InvalidOperationException("Booking is already cancelled.");

        booking.CancellationFee = CancellationPolicy.CalculateFee(booking, DateTime.UtcNow);
        booking.Status          = BookingStatus.Cancelled;

        await _bookings.UpdateAsync(booking);
        return _mapper.Map<BookingDto>(booking);
    }

    // ── Check-in ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Checks in a confirmed booking and pre-authorises a payment for the estimated total.
    /// </summary>
    public async Task<BookingDto> CheckInAsync(int bookingId, int staffId)
    {
        var booking = await _bookings.GetByIdWithDetailsAsync(bookingId)
            ?? throw new KeyNotFoundException($"Booking {bookingId} not found.");

        if (booking.Status != BookingStatus.Confirmed)
            throw new InvalidOperationException("Only confirmed bookings can be checked in.");

        if (DateTime.UtcNow.Date < booking.CheckInDate.Date)
            throw new InvalidOperationException("Cannot check in before the booking's check-in date.");

        // Pre-authorise payment for the current estimated total
        await _payments.AddAsync(new Payment
        {
            BookingId         = bookingId,
            Amount            = booking.TotalAmount,
            Method            = PaymentMethod.CreditCard, // Phase 6: take from guest payment profile
            Status            = PaymentStatus.Authorised,
            TransactionRef    = $"PREAUTH-{bookingId}-{DateTime.UtcNow:yyyyMMddHHmmss}",
            ProcessedAt       = DateTime.UtcNow,
            ProcessedByStaffId = staffId > 0 ? staffId : null,
        });

        booking.Status = BookingStatus.CheckedIn;
        await _bookings.UpdateAsync(booking);
        return _mapper.Map<BookingDto>(booking);
    }

    // ── Check-out ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Checks out a booking: recalculates the final bill, generates an invoice with
    /// line items (rooms + services + 20% VAT), captures the pre-authorised payment,
    /// and marks the booking as CheckedOut.
    /// </summary>
    public async Task<BookingDto> CheckOutAsync(int bookingId, int staffId)
    {
        var booking = await _bookings.GetByIdWithDetailsAsync(bookingId)
            ?? throw new KeyNotFoundException($"Booking {bookingId} not found.");

        if (booking.Status != BookingStatus.CheckedIn)
            throw new InvalidOperationException("Only checked-in bookings can be checked out.");

        var nights = (booking.CheckOutDate.Date - booking.CheckInDate.Date).Days;

        // ── Build invoice line items ───────────────────────────────────────────
        var lineItems = new List<InvoiceLineItem>();
        decimal subtotal = 0m;

        foreach (var br in booking.BookingRooms)
        {
            var lineTotal = br.PriceAtBooking * nights;
            var roomType  = br.Room?.Type.ToString() ?? "Room";
            var roomNum   = br.Room?.RoomNumber ?? br.RoomId.ToString();

            lineItems.Add(new InvoiceLineItem
            {
                Description = $"{roomNum} ({roomType}) – {nights} night{(nights == 1 ? "" : "s")} @ ${br.PriceAtBooking:F2}/night",
                Quantity    = nights,
                UnitPrice   = br.PriceAtBooking,
                LineTotal   = lineTotal,
            });
            subtotal += lineTotal;
        }

        foreach (var bs in booking.BookingServices)
        {
            var svcName  = bs.Service?.Name ?? "Service";
            var unitFee  = bs.Quantity > 0 ? Math.Round(bs.TotalFee / bs.Quantity, 2) : bs.TotalFee;

            lineItems.Add(new InvoiceLineItem
            {
                Description = $"{svcName} × {bs.Quantity}",
                Quantity    = bs.Quantity,
                UnitPrice   = unitFee,
                LineTotal   = bs.TotalFee,
            });
            subtotal += bs.TotalFee;
        }

        var taxAmount   = Math.Round(subtotal * VatRate, 2);
        var totalAmount = subtotal + taxAmount;

        // ── Create invoice ────────────────────────────────────────────────────
        await _invoices.AddAsync(new Invoice
        {
            BookingId     = bookingId,
            InvoiceNumber = $"INV-{bookingId:D6}-{DateTime.UtcNow.Year}",
            IssuedAt      = DateTime.UtcNow,
            Subtotal      = subtotal,
            TaxAmount     = taxAmount,
            TotalAmount   = totalAmount,
            LineItems     = lineItems,
        });

        // ── Capture the pre-authorised payment ────────────────────────────────
        var allPayments = await _payments.GetByBookingIdAsync(bookingId);
        var preAuth     = allPayments.FirstOrDefault(p => p.Status == PaymentStatus.Authorised);
        if (preAuth is not null)
        {
            preAuth.Status = PaymentStatus.Captured;
            preAuth.Amount = totalAmount;
            await _payments.UpdateAsync(preAuth);
        }

        // ── Finalise booking ──────────────────────────────────────────────────
        booking.TotalAmount = totalAmount;
        booking.Status      = BookingStatus.CheckedOut;
        await _bookings.UpdateAsync(booking);

        return _mapper.Map<BookingDto>(booking);
    }
}
