// Author: Salaams
using HMS.Domain.Entities;
using HMS.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using BcryptHelper = BCrypt.Net.BCrypt;

namespace HMS.Infrastructure.Persistence;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HmsDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<HmsDbContext>>();

        await db.Database.MigrateAsync();

        if (await db.Hotels.AnyAsync()) return;

        logger.LogInformation("Seeding database...");

        // ── Hotels ────────────────────────────────────────────────────────────
        var hotels = new List<Hotel>
        {
            new()
            {
                Name    = "Grand Plaza Sunset Reef Hotel",
                City    = "Maafushi",
                Country = "Maldives",
                Address = "Maafushi Island, Kaafu Atoll, Maldives",
                Phone   = "+960 400 1002",
                Email   = "sunsetreef@grandplaza.mv"
            },
            new()
            {
                Name    = "Grand Plaza Coconut Breeze Retreat",
                City    = "Addu City",
                Country = "Maldives",
                Address = "Hithadhoo, Addu Atoll (Seenu), Maldives",
                Phone   = "+960 400 1003",
                Email   = "coconutbreeze@grandplaza.mv"
            },
            new()
            {
                Name    = "Grand Plaza Pearl Sands Water Hotel",
                City    = "Dhigurah",
                Country = "Maldives",
                Address = "Dhigurah Island, South Ari Atoll (Alif Dhaal), Maldives",
                Phone   = "+960 400 1004",
                Email   = "pearlsands@grandplaza.mv"
            },
            new()
            {
                Name    = "Grand Plaza Coral Tide Inn",
                City    = "Dhidhdhoo",
                Country = "Maldives",
                Address = "Dhidhdhoo Island, Haa Alif Atoll, Maldives",
                Phone   = "+960 400 1005",
                Email   = "coraltide@grandplaza.mv"
            },
            new()
            {
                Name    = "Grand Plaza Equator Sands Hotel",
                City    = "Fuvahmulah",
                Country = "Maldives",
                Address = "Fuvahmulah Island, Gnaviyani Atoll, Maldives",
                Phone   = "+960 400 1006",
                Email   = "equatorsands@grandplaza.mv"
            },
        };

        // ── Resorts ───────────────────────────────────────────────────────────
        var resorts = new List<Hotel>
        {
            new()
            {
                Name    = "Grand Plaza Azure Lagoon Resort",
                City    = "Male",
                Country = "Maldives",
                Address = "North Malé Atoll (Kaafu), Maldives",
                Phone   = "+960 400 1001",
                Email   = "azurelagoon@grandplaza.mv"
            },
            new()
            {
                Name    = "Grand Plaza Manta Bay Resort",
                City    = "Hanifaru Bay",
                Country = "Maldives",
                Address = "Baa Atoll, UNESCO Biosphere Reserve, Maldives",
                Phone   = "+960 400 1007",
                Email   = "mantabay@grandplaza.mv"
            },
        };

        db.Hotels.AddRange(hotels);
        db.Hotels.AddRange(resorts);
        await db.SaveChangesAsync();

        // ── Rooms ─────────────────────────────────────────────────────────────
        var rooms = new List<Room>();

        // Hotels — at least 3 rooms each with variety
        foreach (var hotel in hotels)
        {
            rooms.AddRange(new[]
            {
                new Room
                {
                    HotelId     = hotel.Id,
                    RoomNumber  = "101",
                    Type        = RoomType.StandardDouble,
                    Capacity    = 2,
                    PriceOffPeak = 140,
                    PricePeak   = 195,
                    FloorNumber = 1,
                    Status      = RoomStatus.Available,
                    Description = "Comfortable standard room with island-inspired interior design."
                },
                new Room
                {
                    HotelId     = hotel.Id,
                    RoomNumber  = "102",
                    Type        = RoomType.StandardDouble,
                    Capacity    = 2,
                    PriceOffPeak = 165,
                    PricePeak   = 225,
                    FloorNumber = 1,
                    Status      = RoomStatus.Available,
                    Description = "Ocean-view standard room with private balcony seating area."
                },
                new Room
                {
                    HotelId     = hotel.Id,
                    RoomNumber  = "201",
                    Type        = RoomType.DeluxeKing,
                    Capacity    = 2,
                    PriceOffPeak = 285,
                    PricePeak   = 385,
                    FloorNumber = 2,
                    Status      = RoomStatus.Available,
                    Description = "Spacious deluxe room with premium amenities and panoramic sea views."
                },
                new Room
                {
                    HotelId     = hotel.Id,
                    RoomNumber  = "202",
                    Type        = RoomType.DeluxeKing,
                    Capacity    = 2,
                    PriceOffPeak = 325,
                    PricePeak   = 430,
                    FloorNumber = 2,
                    Status      = RoomStatus.Cleaning,
                    Description = "Deluxe sunset-facing room with lounge area, minibar, and soaking tub."
                },
                new Room
                {
                    HotelId     = hotel.Id,
                    RoomNumber  = "301",
                    Type        = RoomType.FamilySuite,
                    Capacity    = 4,
                    PriceOffPeak = 510,
                    PricePeak   = 665,
                    FloorNumber = 3,
                    Status      = RoomStatus.Available,
                    Description = "Family suite with two bedrooms, a private living area, and partial ocean view."
                },
            });
        }

        // Resorts — at least 4 rooms each with luxury villa types
        foreach (var resort in resorts)
        {
            rooms.AddRange(new[]
            {
                new Room
                {
                    HotelId     = resort.Id,
                    RoomNumber  = "101",
                    Type        = RoomType.BeachVilla,
                    Capacity    = 2,
                    PriceOffPeak = 660,
                    PricePeak   = 910,
                    FloorNumber = 1,
                    Status      = RoomStatus.Available,
                    Description = "Private beachfront villa with outdoor deck and tropical garden."
                },
                new Room
                {
                    HotelId     = resort.Id,
                    RoomNumber  = "102",
                    Type        = RoomType.BeachVilla,
                    Capacity    = 2,
                    PriceOffPeak = 730,
                    PricePeak   = 990,
                    FloorNumber = 1,
                    Status      = RoomStatus.Available,
                    Description = "Luxury beach villa with private plunge pool and direct lagoon access."
                },
                new Room
                {
                    HotelId     = resort.Id,
                    RoomNumber  = "201",
                    Type        = RoomType.WaterVilla,
                    Capacity    = 2,
                    PriceOffPeak = 960,
                    PricePeak   = 1370,
                    FloorNumber = 2,
                    Status      = RoomStatus.Available,
                    Description = "Over-lagoon water villa with glass floor panels and private sunken terrace."
                },
                new Room
                {
                    HotelId     = resort.Id,
                    RoomNumber  = "301",
                    Type        = RoomType.OverwaterBungalow,
                    Capacity    = 2,
                    PriceOffPeak = 1250,
                    PricePeak   = 1750,
                    FloorNumber = 3,
                    Status      = RoomStatus.Available,
                    Description = "Luxury overwater bungalow with infinity pool and unobstructed sunset views."
                },
                new Room
                {
                    HotelId     = resort.Id,
                    RoomNumber  = "401",
                    Type        = RoomType.HoneymoonVilla,
                    Capacity    = 2,
                    PriceOffPeak = 1650,
                    PricePeak   = 2250,
                    FloorNumber = 4,
                    Status      = RoomStatus.Available,
                    Description = "Exclusive honeymoon villa with private butler, floating breakfast, and outdoor cinema."
                },
                new Room
                {
                    HotelId     = resort.Id,
                    RoomNumber  = "501",
                    Type        = RoomType.PresidentialVilla,
                    Capacity    = 6,
                    PriceOffPeak = 3600,
                    PricePeak   = 5200,
                    FloorNumber = 5,
                    Status      = RoomStatus.Available,
                    Description = "Grand presidential villa with private pool, ocean deck, spa suite, and dedicated personal chef."
                },
            });
        }

        db.Rooms.AddRange(rooms);
        await db.SaveChangesAsync();

        // ── Users ─────────────────────────────────────────────────────────────
        var admin = new StaffUser
        {
            Email              = "admin@grandplaza.com",
            PasswordHash       = BcryptHelper.HashPassword("Admin@1234!", workFactor: 12),
            Role               = UserRole.Admin,
            FirstName          = "Admin",
            LastName           = "User",
            EmployeeId         = "EMP001",
            Department         = "Administration",
            LastPasswordChange = DateTime.UtcNow,
            CreatedAt          = DateTime.UtcNow,
        };

        var manager = new StaffUser
        {
            Email              = "manager@grandplaza.com",
            PasswordHash       = BcryptHelper.HashPassword("Manager@1234!", workFactor: 12),
            Role               = UserRole.HotelManager,
            FirstName          = "Aishath",
            LastName           = "Latheef",
            EmployeeId         = "EMP002",
            Department         = "Resort Operations",
            LastPasswordChange = DateTime.UtcNow,
            CreatedAt          = DateTime.UtcNow,
        };

        var staff = new StaffUser
        {
            Email              = "staff@grandplaza.com",
            PasswordHash       = BcryptHelper.HashPassword("Staff@1234!", workFactor: 12),
            Role               = UserRole.FrontDeskStaff,
            FirstName          = "Mohamed",
            LastName           = "Shifan",
            EmployeeId         = "EMP003",
            Department         = "Front Office",
            LastPasswordChange = DateTime.UtcNow,
            CreatedAt          = DateTime.UtcNow,
        };

        var guest1 = new GuestUser
        {
            Email              = "guest@example.com",
            PasswordHash       = BcryptHelper.HashPassword("Guest@1234!", workFactor: 12),
            Role               = UserRole.Guest,
            FirstName          = "Grace",
            LastName           = "Taylor",
            Phone              = "+960 7778899",
            Address            = "M. Blue Reef, Male, Maldives",
            LastPasswordChange = DateTime.UtcNow,
            CreatedAt          = DateTime.UtcNow,
        };

        var guest2 = new GuestUser
        {
            Email              = "ibrahim.fathimath@example.mv",
            PasswordHash       = BcryptHelper.HashPassword("Guest@1234!", workFactor: 12),
            Role               = UserRole.Guest,
            FirstName          = "Fathimath",
            LastName           = "Ibrahim",
            Phone              = "+960 7889941",
            Address            = "K. Kaashidhoo, North Malé Atoll, Maldives",
            LastPasswordChange = DateTime.UtcNow,
            CreatedAt          = DateTime.UtcNow,
        };

        db.Users.AddRange(admin, manager, staff, guest1, guest2);
        await db.SaveChangesAsync();

        // ── Ancillary Services ─────────────────────────────────────────────────
        var services = new List<AncillaryService>
        {
            new()
            {
                Name        = "Speedboat Transfer",
                Description = "Round-trip speedboat transfer from Velana International Airport.",
                Fee         = 95,
                Unit        = "per person"
            },
            new()
            {
                Name        = "Seaplane Transfer",
                Description = "Luxury seaplane transfer to the resort island.",
                Fee         = 350,
                Unit        = "per person"
            },
            new()
            {
                Name        = "Sunset Dolphin Cruise",
                Description = "Evening cruise with dolphin watching experience.",
                Fee         = 80,
                Unit        = "per person"
            },
            new()
            {
                Name        = "Spa & Wellness Package",
                Description = "Relaxing spa treatment with sauna and deep-tissue massage.",
                Fee         = 150,
                Unit        = "per session"
            },
            new()
            {
                Name        = "Scuba Diving Excursion",
                Description = "Guided scuba diving session at coral reef sites.",
                Fee         = 200,
                Unit        = "per trip"
            },
            new()
            {
                Name        = "Floating Breakfast",
                Description = "Private floating breakfast served in villa pool.",
                Fee         = 65,
                Unit        = "per booking"
            },
        };

        db.AncillaryServices.AddRange(services);
        await db.SaveChangesAsync();

        // ── Bookings ──────────────────────────────────────────────────────────
        var now = DateTime.UtcNow.Date;

        // Pick rooms per hotel — using LINQ to avoid index assumptions
        var confirmedRoom  = rooms.First(r => r.HotelId == hotels[0].Id && r.Type == RoomType.DeluxeKing);
        var checkedInRoom  = rooms.First(r => r.HotelId == hotels[1].Id && r.Type == RoomType.StandardDouble);
        var completedRoom  = rooms.First(r => r.HotelId == hotels[2].Id && r.Type == RoomType.FamilySuite);
        var cancelledRoom  = rooms.First(r => r.HotelId == resorts[0].Id && r.Type == RoomType.BeachVilla);

        // 1 — Confirmed (future, 16 days out)
        var bookingConfirmed = new Booking
        {
            GuestId         = guest1.Id,
            HotelId         = hotels[0].Id,
            CheckInDate     = now.AddDays(16),
            CheckOutDate    = now.AddDays(20),
            Status          = BookingStatus.Confirmed,
            TotalAmount     = confirmedRoom.PriceOffPeak * 4,
            CancellationFee = 0,
            Notes           = "Guest requested honeymoon-style room decoration.",
            CreatedAt       = now.AddDays(-3),
        };

        // 2 — CheckedIn (started yesterday)
        var bookingCheckedIn = new Booking
        {
            GuestId         = guest2.Id,
            HotelId         = hotels[1].Id,
            CheckInDate     = now.AddDays(-1),
            CheckOutDate    = now.AddDays(3),
            Status          = BookingStatus.CheckedIn,
            TotalAmount     = checkedInRoom.PriceOffPeak * 4,
            CancellationFee = 0,
            Notes           = "Early check-in requested.",
            CreatedAt       = now.AddDays(-10),
        };

        // 3 — Completed (stayed 30–35 days ago)
        var bookingCompleted = new Booking
        {
            GuestId         = guest1.Id,
            HotelId         = hotels[2].Id,
            CheckInDate     = now.AddDays(-35),
            CheckOutDate    = now.AddDays(-30),
            Status          = BookingStatus.CheckedOut,
            TotalAmount     = completedRoom.PriceOffPeak * 5,
            CancellationFee = 0,
            Notes           = "Family trip — extra rollaway bed added on arrival.",
            CreatedAt       = now.AddDays(-50),
        };

        // 4 — Cancelled (with cancellation fee)
        var bookingCancelled = new Booking
        {
            GuestId         = guest2.Id,
            HotelId         = resorts[0].Id,
            CheckInDate     = now.AddDays(5),
            CheckOutDate    = now.AddDays(10),
            Status          = BookingStatus.Cancelled,
            TotalAmount     = cancelledRoom.PriceOffPeak * 5,
            CancellationFee = cancelledRoom.PriceOffPeak,   // one-night retention fee
            Notes           = "Cancelled within 14-day window; one-night fee retained.",
            CreatedAt       = now.AddDays(-14),
        };

        db.Bookings.AddRange(bookingConfirmed, bookingCheckedIn, bookingCompleted, bookingCancelled);
        await db.SaveChangesAsync();

        // BookingRooms
        db.BookingRooms.AddRange(
            new BookingRoom { BookingId = bookingConfirmed.Id,  RoomId = confirmedRoom.Id,  PriceAtBooking = confirmedRoom.PriceOffPeak  },
            new BookingRoom { BookingId = bookingCheckedIn.Id,  RoomId = checkedInRoom.Id,  PriceAtBooking = checkedInRoom.PriceOffPeak  },
            new BookingRoom { BookingId = bookingCompleted.Id,  RoomId = completedRoom.Id,  PriceAtBooking = completedRoom.PriceOffPeak  },
            new BookingRoom { BookingId = bookingCancelled.Id,  RoomId = cancelledRoom.Id,  PriceAtBooking = cancelledRoom.PriceOffPeak  }
        );

        // BookingServices — 1–2 per booking
        db.BookingServices.AddRange(
            // Confirmed: speedboat + dolphin cruise
            new BookingService
            {
                BookingId   = bookingConfirmed.Id,
                ServiceId   = services[0].Id,   // Speedboat Transfer
                Quantity    = 2,
                ServiceDate = bookingConfirmed.CheckInDate,
                TotalFee    = services[0].Fee * 2,
            },
            new BookingService
            {
                BookingId   = bookingConfirmed.Id,
                ServiceId   = services[2].Id,   // Sunset Dolphin Cruise
                Quantity    = 2,
                ServiceDate = bookingConfirmed.CheckInDate.AddDays(1),
                TotalFee    = services[2].Fee * 2,
            },

            // CheckedIn: seaplane transfer
            new BookingService
            {
                BookingId   = bookingCheckedIn.Id,
                ServiceId   = services[1].Id,   // Seaplane Transfer
                Quantity    = 2,
                ServiceDate = bookingCheckedIn.CheckInDate,
                TotalFee    = services[1].Fee * 2,
            },

            // Completed: spa + scuba
            new BookingService
            {
                BookingId   = bookingCompleted.Id,
                ServiceId   = services[3].Id,   // Spa & Wellness
                Quantity    = 2,
                ServiceDate = bookingCompleted.CheckInDate.AddDays(1),
                TotalFee    = services[3].Fee * 2,
            },
            new BookingService
            {
                BookingId   = bookingCompleted.Id,
                ServiceId   = services[4].Id,   // Scuba Diving
                Quantity    = 2,
                ServiceDate = bookingCompleted.CheckInDate.AddDays(2),
                TotalFee    = services[4].Fee * 2,
            },

            // Cancelled: floating breakfast (prepaid, non-refundable)
            new BookingService
            {
                BookingId   = bookingCancelled.Id,
                ServiceId   = services[5].Id,   // Floating Breakfast
                Quantity    = 1,
                ServiceDate = bookingCancelled.CheckInDate,
                TotalFee    = services[5].Fee,
            }
        );

        await db.SaveChangesAsync();

        logger.LogInformation("Database seeding complete.");
    }
}
