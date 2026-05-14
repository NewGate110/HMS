// Author: Salaams
using HMS.Application.BusinessRules;
using HMS.Domain.Entities;

namespace HMS.Tests.UnitTests.Policies;

public class PricingPolicyTests
{
    // ── IsPeakSeason ─────────────────────────────────────────────────────────

    [Theory]
    [InlineData(6,  1)]   // June 1
    [InlineData(7,  15)]  // July 15
    [InlineData(8,  31)]  // August 31
    public void IsPeakSeason_SummerMonths_ReturnsTrue(int month, int day)
    {
        var date = new DateTime(2025, month, day);
        Assert.True(PricingPolicy.IsPeakSeason(date));
    }

    [Theory]
    [InlineData(12, 20)]  // Dec 20 — first peak day
    [InlineData(12, 25)]  // Christmas Day
    [InlineData(12, 31)]  // New Year's Eve
    public void IsPeakSeason_ChristmasWindow_ReturnsTrue(int month, int day)
    {
        var date = new DateTime(2025, month, day);
        Assert.True(PricingPolicy.IsPeakSeason(date));
    }

    [Theory]
    [InlineData(1, 1)]  // New Year's Day
    [InlineData(1, 3)]  // Jan 3
    [InlineData(1, 5)]  // Jan 5 — last peak day
    public void IsPeakSeason_NewYearWindow_ReturnsTrue(int month, int day)
    {
        var date = new DateTime(2025, month, day);
        Assert.True(PricingPolicy.IsPeakSeason(date));
    }

    [Fact]
    public void IsPeakSeason_Dec19_ReturnsFalse()
    {
        Assert.False(PricingPolicy.IsPeakSeason(new DateTime(2025, 12, 19)));
    }

    [Fact]
    public void IsPeakSeason_Jan6_ReturnsFalse()
    {
        Assert.False(PricingPolicy.IsPeakSeason(new DateTime(2025, 1, 6)));
    }

    [Theory]
    [InlineData(2)]   // February
    [InlineData(3)]   // March
    [InlineData(4)]   // April
    [InlineData(5)]   // May
    [InlineData(9)]   // September
    [InlineData(10)]  // October
    [InlineData(11)]  // November
    public void IsPeakSeason_OffPeakMonths_ReturnsFalse(int month)
    {
        var date = new DateTime(2025, month, 15);
        Assert.False(PricingPolicy.IsPeakSeason(date));
    }

    // ── GetNightlyRate ────────────────────────────────────────────────────────

    [Fact]
    public void GetNightlyRate_PeakDate_ReturnsPeakPrice()
    {
        var room = new Room { PricePeak = 250m, PriceOffPeak = 120m };
        var peakDate = new DateTime(2025, 7, 1); // July — peak

        var rate = PricingPolicy.GetNightlyRate(room, peakDate);

        Assert.Equal(250m, rate);
    }

    [Fact]
    public void GetNightlyRate_OffPeakDate_ReturnsOffPeakPrice()
    {
        var room = new Room { PricePeak = 250m, PriceOffPeak = 120m };
        var offPeakDate = new DateTime(2025, 3, 10); // March — off-peak

        var rate = PricingPolicy.GetNightlyRate(room, offPeakDate);

        Assert.Equal(120m, rate);
    }
}
