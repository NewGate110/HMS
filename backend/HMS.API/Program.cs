using System.Text;
using HMS.Application;
using HMS.Infrastructure;
using HMS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

// Npgsql v6+ requires UTC DateTimes for timestamptz columns.
// This switch lets Unspecified-kind DateTimes (e.g. from query strings) pass through.
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// ── Configuration sources ──────────────────────────────────────────────────
builder.Configuration
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile(
        $"appsettings.{builder.Environment.EnvironmentName}.json",
        optional: true,
        reloadOnChange: true)
    .AddJsonFile(
        "appsettings.Local.json",
        optional: true,
        reloadOnChange: true)
    .AddEnvironmentVariables();

// ── CORS — allow Angular dev server with credentials ───────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("HmsUI", policy =>
        policy
            .WithOrigins("http://localhost:4200", "https://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());   // required for HttpOnly cookie exchange
});

// ── JWT authentication (reads token from HttpOnly cookie OR Authorization header) ──
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"] ?? throw new InvalidOperationException("Jwt:Key not configured.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;   // keep claim names as-is ("role", "sub", etc.)

        // Read JWT from the HttpOnly cookie if the Authorization header is absent
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                if (string.IsNullOrEmpty(ctx.Token) &&
                    ctx.Request.Cookies.TryGetValue("hms.auth", out var cookieToken))
                {
                    ctx.Token = cookieToken;
                }
                return Task.CompletedTask;
            }
        };

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"] ?? "HMS",
            ValidAudience = jwtSection["Audience"] ?? "HMS",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = "role",
            NameClaimType = "sub",
        };
    });

builder.Services.AddAuthorization();

// ── Application services ───────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

// ── HTTP pipeline ──────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "HMS API V1");
    });
}
else
{
    // HSTS — 1 year, include subdomains
    app.UseHsts();
}

app.UseCors("HmsUI");       // must be before UseAuthentication
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await DataSeeder.SeedAsync(app.Services);

app.Run();
