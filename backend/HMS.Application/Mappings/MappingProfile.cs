// Author: Salaams
using AutoMapper;
using HMS.Application.DTOs.Bookings;
using HMS.Application.DTOs.Hotels;
using HMS.Application.DTOs.Invoices;
using HMS.Application.DTOs.Payments;
using HMS.Application.DTOs.Rooms;
using HMS.Application.DTOs.Services;
using HMS.Application.DTOs.Users;
using HMS.Domain.Entities;

namespace HMS.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // ── Hotels ────────────────────────────────────────────────────────────
        CreateMap<Hotel, HotelDto>();
        CreateMap<Hotel, HotelSummaryDto>();

        // ── Rooms ─────────────────────────────────────────────────────────────
        CreateMap<Room, RoomDto>()
            .ForMember(d => d.HotelName, o => o.MapFrom(s => s.Hotel != null ? s.Hotel.Name : string.Empty))
            .ForMember(d => d.Type,      o => o.MapFrom(s => s.Type.ToString()))
            .ForMember(d => d.Status,    o => o.MapFrom(s => s.Status.ToString()));

        // ── Bookings ──────────────────────────────────────────────────────────
        CreateMap<Booking, BookingDto>()
            .ForMember(d => d.GuestName, o => o.MapFrom(s =>
                s.Guest != null ? $"{s.Guest.FirstName} {s.Guest.LastName}" : string.Empty))
            .ForMember(d => d.HotelName, o => o.MapFrom(s =>
                s.Hotel != null ? s.Hotel.Name : string.Empty))
            .ForMember(d => d.Status,    o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.Rooms,     o => o.MapFrom(s =>
                s.BookingRooms.Select(br => br.Room).ToList()))
            .ForMember(d => d.Services,  o => o.MapFrom(s => s.BookingServices));

        // BookingService entity → BookingServiceDto
        // (Note: HMS.Domain.Entities.BookingService is the join entity, not this service class)
        CreateMap<BookingService, BookingServiceDto>()
            .ForMember(d => d.ServiceName, o => o.MapFrom(s =>
                s.Service != null ? s.Service.Name : string.Empty));

        // ── Users ─────────────────────────────────────────────────────────────
        CreateMap<GuestUser, GuestUserDto>()
            .ForMember(d => d.Role, o => o.MapFrom(s => s.Role.ToString()));

        CreateMap<StaffUser, StaffUserDto>()
            .ForMember(d => d.Role,      o => o.MapFrom(s => s.Role.ToString()))
            .ForMember(d => d.IsLocked,  o => o.MapFrom(s => s.IsLocked))
            .ForMember(d => d.IsActive,  o => o.MapFrom(s => s.IsActive));

        // ── Payments ──────────────────────────────────────────────────────────
        CreateMap<Payment, PaymentDto>()
            .ForMember(d => d.Method, o => o.MapFrom(s => s.Method.ToString()))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()));

        // ── Invoices ──────────────────────────────────────────────────────────
        CreateMap<Invoice, InvoiceDto>();
        CreateMap<InvoiceLineItem, InvoiceLineItemDto>();

        // ── Ancillary Services ────────────────────────────────────────────────
        CreateMap<AncillaryService, AncillaryServiceDto>();
    }
}
