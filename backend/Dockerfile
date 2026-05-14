# ── Build stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore dependencies (cached layer)
COPY HMS.Domain/HMS.Domain.csproj           HMS.Domain/
COPY HMS.Application/HMS.Application.csproj HMS.Application/
COPY HMS.Infrastructure/HMS.Infrastructure.csproj HMS.Infrastructure/
COPY HMS.API/HMS.API.csproj                 HMS.API/
RUN dotnet restore HMS.API/HMS.API.csproj

# Build & publish
COPY . .
RUN dotnet publish HMS.API/HMS.API.csproj -c Release -o /app/publish --no-restore

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080

ENTRYPOINT ["dotnet", "HMS.API.dll"]
