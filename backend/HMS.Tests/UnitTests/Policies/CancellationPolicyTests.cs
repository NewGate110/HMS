// Author: Salaams
using HMS.Application.BusinessRules;
using HMS.Domain.Entities;
using HMS.Domain.Enums;

namespace HMS.Tests.UnitTests.Policies;

public class CancellationPolicyTests
{
    private const decimal FirstNightRate = 200m;

    // Helper: booking whose check-in is `hoursAway` hours from `now`
    private static Booking MakeBooking(double hoursAway, decimal priceAtBooking = FirstNightRate)
    {
        var now = DateTime.UtcNow;
        var booking = new Booking
        {
            CheckInDate  = now.AddHours(hoursAway),
            CheckOutDate = now.AddHours(hoursAway + 24),
            Status       = BookingStatus.Confirmed,
            TotalAmount  = priceAtBooking * 2,
        };
        booking.BookingRooms.Add(new BookingRoom { PriceAtBooking = priceAtBooking });
        return booking;
    }

    // ── Free cancellation (> 14 days / 336 h) ────────────────────────────────

    [Fact]
    public void CalculateFee_MoreThan14Days_ReturnsZero()
    {
        var booking = MakeBooking(hoursAway: 360); // 15 days
        var fee = CancellationPolicy.CalculateFee(booking, DateTime.UtcNow);
        Assert.Equal(0m, fee);
    }

    [Fact]
    public void CalculateFee_Exactly14Days_ReturnsZero()
    {
        // Boundary: exactly 336 h is NOT > 336, falls into partial fee band
        // 336 h + 1 s is > 336 h → free
        var booking = MakeBooking(hoursAway: 336.01);
        var fee = CancellationPolicy.CalculateFee(booking, DateTime.UtcNow);
        Assert.Equal(0m, fee);
    }

    // ── Partial fee (72 h < hours ≤ 336 h) ───────────────────────────────────

    [Fact]
    public void CalculateFee_JustUnder14Days_ReturnsHalfFirstNight()
    {
        var booking = MakeBooking(hoursAway: 335); // 13 days 23 h
        var fee = CancellationPolicy.CalculateFee(booking, DateTime.UtcNow);
        Assert.Equal(Math.Round(FirstNightRate * 0.5m, 2), fee);
    }

    [Fact]
    public void CalculateFee_4DaysBefore_ReturnsHalfFirstNight()
    {
        var booking = MakeBooking(hoursAway: 96); // 4 days
        var fee = CancellationPolicy.CalculateFee(booking, DateTime.UtcNow);
        Assert.Equal(Math.Round(FirstNightRate * 0.5m, 2), fee);
    }

    [Fact]
    public void CalculateFee_JustOver72Hours_ReturnsHalfFirstNight()
    {
        var booking = MakeBooking(hoursAway: 72.01);
        var fee = CancellationPolicy.CalculateFee(booking, DateTime.UtcNow);
        Assert.Equal(Math.Round(FirstNightRate * 0.5m, 2), fee);
    }

    // ── Full fee (≤ 72 h) ─────────────────────────────────────────────────────

    [Fact]
    public void CalculateFee_Exactly72Hours_ReturnsFullFirstNight()
    {
        // Exactly 72 h is NOT > 72, falls into full-fee band
        var booking = MakeBooking(hoursAway: 72);
        var fee = CancellationPolicy.CalculateFee(booking, DateTime.UtcNow);
        Assert.Equal(FirstNightRate, fee);
    }

    [Fact]
    public void CalculateFee_24HoursBefore_ReturnsFullFirstNight()
    {
        var booking = MakeBooking(hoursAway: 24);
        var fee = CancellationPolicy.CalculateFee(booking, DateTime.UtcNow);
        Assert.Equal(FirstNightRate, fee);
    }

    [Fact]
    public void CalculateFee_1HourBefore_ReturnsFullFirstNight()
    {
        var booking = MakeBooking(hoursAway: 1);
        var fee = CancellationPolicy.CalculateFee(booking, DateTime.UtcNow);
        Assert.Equal(FirstNightRate, fee);
    }

    // ── Edge case: no rooms ───────────────────────────────────────────────────

    [Fact]
    public void CalculateFee_NoRooms_ReturnsZero()
    {
        var booking = new Booking
        {
            CheckInDate  = DateTime.UtcNow.AddHours(1),
            CheckOutDate = DateTime.UtcNow.AddHours(25),
            Status       = BookingStatus.Confirmed,
            // BookingRooms is empty — DefaultIfEmpty(0m) should kick in
        };
        var fee = CancellationPolicy.CalculateFee(booking, DateTime.UtcNow);
        Assert.Equal(0m, fee); // 100% of 0 = 0
    }

    // ── NoShowFee ─────────────────────────────────────────────────────────────

    [Fact]
    public void NoShowFee_ReturnsFullBookingTotal()
    {
        var booking = new Booking { TotalAmount = 540m };
        Assert.Equal(540m, CancellationPolicy.NoShowFee(booking));
    }
}
