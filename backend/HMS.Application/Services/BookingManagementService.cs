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

    // ── Cancel ────────────────────────────────────────────────────────────────

    /// <summary>
    /// Cancels a booking and applies the spec cancellation-fee policy.
    /// </summary>
    public async Task<BookingDto> CancelBookingAsync(int bookingId, int requestingUserId)
    {
        var booking = await _bookings.GetByIdWithDetailsAsync(bookingId)
            ?? throw new KeyNotFoundException($"Booking {bookingId} not found.");

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
                Description = $"{roomNum} ({roomType}) – {nights} night{(nights == 1 ? "" : "s")} @ £{br.PriceAtBooking:F2}/night",
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
