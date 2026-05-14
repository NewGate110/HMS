// Author: Salaams
using AutoMapper;
using HMS.Application.DTOs.Bookings;
using HMS.Application.Interfaces.Repositories;
using HMS.Application.Services;
using HMS.Domain.Entities;
using HMS.Domain.Enums;
using Moq;

namespace HMS.Tests.UnitTests.Services;

public class BookingManagementServiceTests
{
    // ── Mocks ─────────────────────────────────────────────────────────────────

    private readonly Mock<IBookingRepository>          _bookingRepo  = new();
    private readonly Mock<IRoomRepository>             _roomRepo     = new();
    private readonly Mock<IAncillaryServiceRepository> _serviceRepo  = new();
    private readonly Mock<IPaymentRepository>          _paymentRepo  = new();
    private readonly Mock<IInvoiceRepository>          _invoiceRepo  = new();
    private readonly Mock<IMapper>                     _mapper       = new();

    private BookingManagementService BuildSut() => new(
        _bookingRepo.Object,
        _roomRepo.Object,
        _serviceRepo.Object,
        _paymentRepo.Object,
        _invoiceRepo.Object,
        _mapper.Object);

    // Mapper returns empty DTO by default — tests focus on business logic, not mapping
    private void SetupMapper()
    {
        _mapper.Setup(m => m.Map<BookingDto>(It.IsAny<Booking>()))
               .Returns(new BookingDto());
        _mapper.Setup(m => m.Map<IEnumerable<BookingDto>>(It.IsAny<IEnumerable<Booking>>()))
               .Returns(Array.Empty<BookingDto>());
    }

    // ── CreateBookingAsync — validation guards ─────────────────────────────────

    [Fact]
    public async Task CreateBooking_PastCheckIn_Throws()
    {
        var sut = BuildSut();
        var dto = new CreateBookingDto
        {
            CheckInDate  = DateTime.Today.AddDays(-1), // yesterday
            CheckOutDate = DateTime.Today.AddDays(1),
            RoomIds      = [1],
            GuestCount   = 1,
        };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.CreateBookingAsync(guestId: 1, dto));
    }

    [Fact]
    public async Task CreateBooking_CheckOutBeforeCheckIn_Throws()
    {
        var sut = BuildSut();
        var dto = new CreateBookingDto
        {
            CheckInDate  = DateTime.Today.AddDays(5),
            CheckOutDate = DateTime.Today.AddDays(3), // before check-in
            RoomIds      = [1],
            GuestCount   = 1,
        };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.CreateBookingAsync(guestId: 1, dto));
    }

    [Fact]
    public async Task CreateBooking_SameDateCheckInAndOut_Throws()
    {
        var sut = BuildSut();
        var date = DateTime.Today.AddDays(5);
        var dto = new CreateBookingDto
        {
            CheckInDate  = date,
            CheckOutDate = date, // same day — zero nights
            RoomIds      = [1],
            GuestCount   = 1,
        };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.CreateBookingAsync(guestId: 1, dto));
    }

    [Fact]
    public async Task CreateBooking_NoRoomsSelected_Throws()
    {
        var sut = BuildSut();
        var dto = new CreateBookingDto
        {
            CheckInDate  = DateTime.Today.AddDays(1),
            CheckOutDate = DateTime.Today.AddDays(3),
            RoomIds      = [], // empty
            GuestCount   = 1,
        };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.CreateBookingAsync(guestId: 1, dto));
    }

    [Fact]
    public async Task CreateBooking_RoomNotAvailable_Throws()
    {
        var sut = BuildSut();
        // Repo returns empty — requested room is not in the available list
        _roomRepo.Setup(r => r.GetAvailableRoomsAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
                 .ReturnsAsync([]);

        var dto = new CreateBookingDto
        {
            HotelId      = 1,
            CheckInDate  = DateTime.Today.AddDays(1),
            CheckOutDate = DateTime.Today.AddDays(3),
            RoomIds      = [99],
            GuestCount   = 1,
        };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.CreateBookingAsync(guestId: 1, dto));
    }

    [Fact]
    public async Task CreateBooking_GuestCountExceedsCapacity_Throws()
    {
        var sut = BuildSut();
        var room = new Room { Id = 1, Capacity = 2, PriceOffPeak = 100m, PricePeak = 180m };
        _roomRepo.Setup(r => r.GetAvailableRoomsAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
                 .ReturnsAsync([room]);

        var dto = new CreateBookingDto
        {
            HotelId      = 1,
            CheckInDate  = DateTime.Today.AddDays(1),
            CheckOutDate = DateTime.Today.AddDays(3),
            RoomIds      = [1],
            GuestCount   = 5, // exceeds capacity of 2
        };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.CreateBookingAsync(guestId: 1, dto));
    }

    [Fact]
    public async Task CreateBooking_ServiceQuantityZero_Throws()
    {
        var sut = BuildSut();
        var room = new Room { Id = 1, Capacity = 2, PriceOffPeak = 100m, PricePeak = 180m };
        _roomRepo.Setup(r => r.GetAvailableRoomsAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
                 .ReturnsAsync([room]);

        var checkIn  = DateTime.Today.AddDays(10);
        var checkOut = DateTime.Today.AddDays(12);
        var dto = new CreateBookingDto
        {
            HotelId      = 1,
            CheckInDate  = checkIn,
            CheckOutDate = checkOut,
            RoomIds      = [1],
            GuestCount   = 1,
            Services     = [new BookingServiceRequestDto { ServiceId = 1, Quantity = 0, ServiceDate = checkIn }],
        };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.CreateBookingAsync(guestId: 1, dto));
    }

    [Fact]
    public async Task CreateBooking_ServiceDateOutsideBookingRange_Throws()
    {
        var sut = BuildSut();
        var room = new Room { Id = 1, Capacity = 2, PriceOffPeak = 100m, PricePeak = 180m };
        _roomRepo.Setup(r => r.GetAvailableRoomsAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
                 .ReturnsAsync([room]);

        var checkIn  = DateTime.Today.AddDays(10);
        var checkOut = DateTime.Today.AddDays(12);
        var dto = new CreateBookingDto
        {
            HotelId      = 1,
            CheckInDate  = checkIn,
            CheckOutDate = checkOut,
            RoomIds      = [1],
            GuestCount   = 1,
            Services     = [new BookingServiceRequestDto { ServiceId = 1, Quantity = 1, ServiceDate = checkOut }], // on checkout day — out of range
        };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.CreateBookingAsync(guestId: 1, dto));
    }

    // ── CheckInAsync — date guard ─────────────────────────────────────────────

    [Fact]
    public async Task CheckIn_BeforeCheckInDate_Throws()
    {
        var sut = BuildSut();
        var booking = new Booking
        {
            Status      = BookingStatus.Confirmed,
            CheckInDate = DateTime.Today.AddDays(3), // 3 days in the future
        };
        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<int>()))
                    .ReturnsAsync(booking);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.CheckInAsync(bookingId: 1, staffId: 1));
    }

    // ── CreateBookingAsync — pricing ──────────────────────────────────────────

    [Fact]
    public async Task CreateBooking_OffPeakCheckIn_UsesOffPeakRate()
    {
        var sut = BuildSut();
        SetupMapper();

        var room = new Room { Id = 1, Capacity = 2, PriceOffPeak = 100m, PricePeak = 200m };
        _roomRepo.Setup(r => r.GetAvailableRoomsAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
                 .ReturnsAsync([room]);

        Booking? captured = null;
        _bookingRepo.Setup(r => r.AddAsync(It.IsAny<Booking>()))
                    .Callback<Booking>(b => captured = b)
                    .Returns(Task.CompletedTask);
        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<int>()))
                    .ReturnsAsync(new Booking());

        var dto = new CreateBookingDto
        {
            HotelId      = 1,
            CheckInDate  = new DateTime(2027, 3, 10), // March — off-peak
            CheckOutDate = new DateTime(2027, 3, 13), // 3 nights
            RoomIds      = [1],
            GuestCount   = 1,
        };

        await sut.CreateBookingAsync(guestId: 1, dto);

        // 3 nights × $100 off-peak = $300
        Assert.NotNull(captured);
        Assert.Equal(300m, captured!.TotalAmount);
    }

    [Fact]
    public async Task CreateBooking_PeakCheckIn_UsesPeakRate()
    {
        var sut = BuildSut();
        SetupMapper();

        var room = new Room { Id = 1, Capacity = 2, PriceOffPeak = 100m, PricePeak = 200m };
        _roomRepo.Setup(r => r.GetAvailableRoomsAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
                 .ReturnsAsync([room]);

        Booking? captured = null;
        _bookingRepo.Setup(r => r.AddAsync(It.IsAny<Booking>()))
                    .Callback<Booking>(b => captured = b)
                    .Returns(Task.CompletedTask);
        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<int>()))
                    .ReturnsAsync(new Booking());

        var dto = new CreateBookingDto
        {
            HotelId      = 1,
            CheckInDate  = new DateTime(2027, 7, 1), // July — peak
            CheckOutDate = new DateTime(2027, 7, 3),  // 2 nights
            RoomIds      = [1],
            GuestCount   = 1,
        };

        await sut.CreateBookingAsync(guestId: 1, dto);

        // 2 nights × $200 peak = $400
        Assert.NotNull(captured);
        Assert.Equal(400m, captured!.TotalAmount);
    }

    [Fact]
    public async Task CreateBooking_WithService_IncludesServiceFeeInTotal()
    {
        var sut = BuildSut();
        SetupMapper();

        var room    = new Room { Id = 1, Capacity = 2, PriceOffPeak = 100m, PricePeak = 200m };
        var service = new AncillaryService { Id = 5, Fee = 50m, IsActive = true };

        _roomRepo.Setup(r => r.GetAvailableRoomsAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
                 .ReturnsAsync([room]);
        _serviceRepo.Setup(s => s.GetByIdAsync(5))
                    .ReturnsAsync(service);

        Booking? captured = null;
        _bookingRepo.Setup(r => r.AddAsync(It.IsAny<Booking>()))
                    .Callback<Booking>(b => captured = b)
                    .Returns(Task.CompletedTask);
        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<int>()))
                    .ReturnsAsync(new Booking());

        var dto = new CreateBookingDto
        {
            HotelId      = 1,
            CheckInDate  = new DateTime(2027, 3, 1), // off-peak
            CheckOutDate = new DateTime(2027, 3, 3),  // 2 nights
            RoomIds      = [1],
            GuestCount   = 1,
            Services     =
            [
                new BookingServiceRequestDto { ServiceId = 5, Quantity = 1, ServiceDate = new DateTime(2027, 3, 1) }
            ],
        };

        await sut.CreateBookingAsync(guestId: 1, dto);

        // 2 nights × $100 + $50 service = $250
        Assert.NotNull(captured);
        Assert.Equal(250m, captured!.TotalAmount);
    }

    // ── CancelBookingAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task CancelBooking_NotFound_ThrowsKeyNotFound()
    {
        var sut = BuildSut();
        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<int>()))
                    .ReturnsAsync((Booking?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => sut.CancelBookingAsync(bookingId: 99, requestingUserId: 1));
    }

    [Theory]
    [InlineData(BookingStatus.CheckedIn)]
    [InlineData(BookingStatus.CheckedOut)]
    public async Task CancelBooking_AlreadyActiveOrComplete_Throws(BookingStatus status)
    {
        var sut = BuildSut();
        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<int>()))
                    .ReturnsAsync(new Booking { Status = status });

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.CancelBookingAsync(bookingId: 1, requestingUserId: 1));
    }

    [Fact]
    public async Task CancelBooking_AlreadyCancelled_Throws()
    {
        var sut = BuildSut();
        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<int>()))
                    .ReturnsAsync(new Booking { Status = BookingStatus.Cancelled });

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.CancelBookingAsync(bookingId: 1, requestingUserId: 1));
    }

    [Fact]
    public async Task CancelBooking_MoreThan14Days_ZeroCancellationFee()
    {
        var sut = BuildSut();
        SetupMapper();

        var booking = new Booking
        {
            Status       = BookingStatus.Confirmed,
            CheckInDate  = DateTime.UtcNow.AddDays(15),
            CheckOutDate = DateTime.UtcNow.AddDays(16),
        };
        booking.BookingRooms.Add(new BookingRoom { PriceAtBooking = 200m });

        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<int>()))
                    .ReturnsAsync(booking);
        _bookingRepo.Setup(r => r.UpdateAsync(It.IsAny<Booking>()))
                    .Returns(Task.CompletedTask);

        await sut.CancelBookingAsync(bookingId: 1, requestingUserId: 1);

        Assert.Equal(0m, booking.CancellationFee);
        Assert.Equal(BookingStatus.Cancelled, booking.Status);
    }

    [Fact]
    public async Task CancelBooking_Within72Hours_FullFirstNightFee()
    {
        var sut = BuildSut();
        SetupMapper();

        var booking = new Booking
        {
            Status       = BookingStatus.Confirmed,
            CheckInDate  = DateTime.UtcNow.AddHours(12),
            CheckOutDate = DateTime.UtcNow.AddHours(36),
        };
        booking.BookingRooms.Add(new BookingRoom { PriceAtBooking = 180m });

        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<int>()))
                    .ReturnsAsync(booking);
        _bookingRepo.Setup(r => r.UpdateAsync(It.IsAny<Booking>()))
                    .Returns(Task.CompletedTask);

        await sut.CancelBookingAsync(bookingId: 1, requestingUserId: 1);

        Assert.Equal(180m, booking.CancellationFee);
    }

    // ── CheckInAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task CheckIn_NotFound_ThrowsKeyNotFound()
    {
        var sut = BuildSut();
        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<int>()))
                    .ReturnsAsync((Booking?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => sut.CheckInAsync(bookingId: 1, staffId: 1));
    }

    [Theory]
    [InlineData(BookingStatus.CheckedIn)]
    [InlineData(BookingStatus.CheckedOut)]
    [InlineData(BookingStatus.Cancelled)]
    public async Task CheckIn_NotConfirmed_Throws(BookingStatus status)
    {
        var sut = BuildSut();
        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<int>()))
                    .ReturnsAsync(new Booking { Status = status });

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.CheckInAsync(bookingId: 1, staffId: 1));
    }

    [Fact]
    public async Task CheckIn_ValidBooking_AddsPreAuthPayment()
    {
        var sut = BuildSut();
        SetupMapper();

        var booking = new Booking
        {
            Id          = 42,
            Status      = BookingStatus.Confirmed,
            TotalAmount = 300m,
        };
        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(42))
                    .ReturnsAsync(booking);
        _bookingRepo.Setup(r => r.UpdateAsync(It.IsAny<Booking>()))
                    .Returns(Task.CompletedTask);

        Payment? savedPayment = null;
        _paymentRepo.Setup(p => p.AddAsync(It.IsAny<Payment>()))
                    .Callback<Payment>(p => savedPayment = p)
                    .Returns(Task.CompletedTask);

        await sut.CheckInAsync(bookingId: 42, staffId: 7);

        Assert.NotNull(savedPayment);
        Assert.Equal(PaymentStatus.Authorised, savedPayment!.Status);
        Assert.Equal(300m, savedPayment.Amount);
        Assert.Equal(BookingStatus.CheckedIn, booking.Status);
    }

    // ── CheckOutAsync ─────────────────────────────────────────────────────────

    [Fact]
    public async Task CheckOut_NotFound_ThrowsKeyNotFound()
    {
        var sut = BuildSut();
        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<int>()))
                    .ReturnsAsync((Booking?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => sut.CheckOutAsync(bookingId: 1, staffId: 1));
    }

    [Theory]
    [InlineData(BookingStatus.Confirmed)]
    [InlineData(BookingStatus.Cancelled)]
    [InlineData(BookingStatus.CheckedOut)]
    public async Task CheckOut_NotCheckedIn_Throws(BookingStatus status)
    {
        var sut = BuildSut();
        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<int>()))
                    .ReturnsAsync(new Booking { Status = status });

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.CheckOutAsync(bookingId: 1, staffId: 1));
    }

    [Fact]
    public async Task CheckOut_AppliesVatCorrectly()
    {
        var sut = BuildSut();
        SetupMapper();

        // 1 room, 2 nights × $100 = $200 subtotal → $40 VAT → $240 total
        var booking = new Booking
        {
            Id           = 10,
            Status       = BookingStatus.CheckedIn,
            CheckInDate  = new DateTime(2025, 4, 1),
            CheckOutDate = new DateTime(2025, 4, 3), // 2 nights
        };
        booking.BookingRooms.Add(new BookingRoom
        {
            RoomId         = 1,
            PriceAtBooking = 100m,
            Room           = new Room { RoomNumber = "101", Type = RoomType.StandardDouble },
        });

        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(10)).ReturnsAsync(booking);
        _bookingRepo.Setup(r => r.UpdateAsync(It.IsAny<Booking>())).Returns(Task.CompletedTask);
        _invoiceRepo.Setup(i => i.AddAsync(It.IsAny<Invoice>())).Returns(Task.CompletedTask);
        _paymentRepo.Setup(p => p.GetByBookingIdAsync(It.IsAny<int>())).ReturnsAsync([]);

        await sut.CheckOutAsync(bookingId: 10, staffId: 3);

        // subtotal=200, tax=40, total=240
        Assert.Equal(240m, booking.TotalAmount);
        Assert.Equal(BookingStatus.CheckedOut, booking.Status);
    }

    [Fact]
    public async Task CheckOut_GeneratesInvoiceWithCorrectNumber()
    {
        var sut = BuildSut();
        SetupMapper();

        var booking = new Booking
        {
            Id           = 42,
            Status       = BookingStatus.CheckedIn,
            CheckInDate  = new DateTime(2025, 5, 1),
            CheckOutDate = new DateTime(2025, 5, 2), // 1 night
        };
        booking.BookingRooms.Add(new BookingRoom
        {
            RoomId         = 1,
            PriceAtBooking = 150m,
            Room           = new Room { RoomNumber = "201", Type = RoomType.StandardDouble },
        });

        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(42)).ReturnsAsync(booking);
        _bookingRepo.Setup(r => r.UpdateAsync(It.IsAny<Booking>())).Returns(Task.CompletedTask);
        _paymentRepo.Setup(p => p.GetByBookingIdAsync(It.IsAny<int>())).ReturnsAsync([]);

        Invoice? savedInvoice = null;
        _invoiceRepo.Setup(i => i.AddAsync(It.IsAny<Invoice>()))
                    .Callback<Invoice>(inv => savedInvoice = inv)
                    .Returns(Task.CompletedTask);

        await sut.CheckOutAsync(bookingId: 42, staffId: 1);

        Assert.NotNull(savedInvoice);
        Assert.Equal($"INV-000042-{DateTime.UtcNow.Year}", savedInvoice!.InvoiceNumber);
    }

    [Fact]
    public async Task CheckOut_CapturesPreAuthPayment()
    {
        var sut = BuildSut();
        SetupMapper();

        var booking = new Booking
        {
            Id           = 5,
            Status       = BookingStatus.CheckedIn,
            CheckInDate  = new DateTime(2025, 5, 1),
            CheckOutDate = new DateTime(2025, 5, 2),
        };
        booking.BookingRooms.Add(new BookingRoom
        {
            RoomId         = 1,
            PriceAtBooking = 100m,
            Room           = new Room { RoomNumber = "101", Type = RoomType.StandardDouble },
        });

        var preAuthPayment = new Payment { Status = PaymentStatus.Authorised, Amount = 100m };

        _bookingRepo.Setup(r => r.GetByIdWithDetailsAsync(5)).ReturnsAsync(booking);
        _bookingRepo.Setup(r => r.UpdateAsync(It.IsAny<Booking>())).Returns(Task.CompletedTask);
        _invoiceRepo.Setup(i => i.AddAsync(It.IsAny<Invoice>())).Returns(Task.CompletedTask);
        _paymentRepo.Setup(p => p.GetByBookingIdAsync(5)).ReturnsAsync([preAuthPayment]);
        _paymentRepo.Setup(p => p.UpdateAsync(It.IsAny<Payment>())).Returns(Task.CompletedTask);

        await sut.CheckOutAsync(bookingId: 5, staffId: 1);

        Assert.Equal(PaymentStatus.Captured, preAuthPayment.Status);
    }
}
