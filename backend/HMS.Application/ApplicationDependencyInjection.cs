// Author: Salaams
using HMS.Application.Interfaces.Services;
using HMS.Application.Mappings;
using HMS.Application.Services;
using Microsoft.Extensions.DependencyInjection;
// IAuthService registration added in Phase 6

namespace HMS.Application;

public static class ApplicationDependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // AutoMapper — register profile explicitly (v16 API)
        services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());

        // Application-layer services
        services.AddScoped<IAuthService,            AuthService>();
        services.AddScoped<IHotelService,           HotelService>();
        services.AddScoped<IRoomService,            RoomService>();
        services.AddScoped<IBookingService,         BookingManagementService>();
        services.AddScoped<IUserService,            UserService>();
        services.AddScoped<IPaymentService,         PaymentService>();
        services.AddScoped<IAncillaryServiceService, AncillaryServiceService>();
        services.AddScoped<IReportService,          ReportService>();

        return services;
    }
}
