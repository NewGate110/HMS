GRAND PLAZA - HOTEL MANAGEMENT SYSTEM (HMS)

Module: UFCF8S-30-2 Advanced Software Development
Academic Context: University of the West of England (UWE)
Tech Stack: .NET 10 / Angular 21 / PostgreSQL 18.3 / Docker

PROJECT OVERVIEW
Grand Plaza HMS is a comprehensive hotel management solution designed to streamline operations across multiple properties. The system supports four distinct user roles: Guests, Front Desk Staff, Hotel Managers, and System Administrators. It handles the entire lifecycle of a stay, from room discovery and booking to check-in, billing, and performance reporting.

KEY FEATURES

- Guest Portal: Room search by availability, secure booking, profile management, and booking history.
- Front Desk Operations: Streamlined check-in/check-out workflows, room status management, and ancillary service billing.
- Management Dashboard: Real-time occupancy reports, revenue analytics, and performance monitoring.
- System Administration: User management, hotel configuration, and system-wide audit logging.
- Security: JWT-based authentication, Role-Based Access Control (RBAC), and comprehensive audit trails.

TECH STACK AND ARCHITECTURE
The project follows a Clean Architecture pattern to ensure maintainability, testability, and separation of concerns.

- Backend: .NET 10 Core Web API
  - HMS.Domain: Pure domain entities, enums, and repository interfaces.
  - HMS.Application: Business logic, DTOs, AutoMapper profiles, and service implementations.
  - HMS.Infrastructure: EF Core DbContext, PostgreSQL repository implementations, and migrations.
  - HMS.API: RESTful controllers, middleware, and dependency injection wiring.
- Frontend: Angular 21 (SPA)
  - Modular architecture with standalone components.
  - Reactive forms for booking and management.
- Database: PostgreSQL 18.3
- Containerization: Docker and Docker Compose for local infrastructure.

GETTING STARTED

Prerequisites:

- .NET 10 SDK (https://dotnet.microsoft.com/download/dotnet/10.0)
- Node.js v22+ (https://nodejs.org/)
- Angular CLI (https://angular.dev/tools/cli)
- Docker Desktop (https://www.docker.com/products/docker-desktop/)

1. Infrastructure Setup (PostgreSQL and pgAdmin)
   The project uses Docker to manage the database. Note that the PostgreSQL host port is mapped to 5433 to avoid conflicts with local installations.

Command: docker-compose up -d

- Postgres: localhost:5433
- pgAdmin: http://localhost:5050 (Credentials in .env)

2. Backend Setup
   Commands:
   cd backend
   dotnet restore
   dotnet build

# Apply migrations and seed data (automatic on first run)

cd HMS.API
dotnet run

- Swagger UI: https://localhost:5001/swagger

3. Frontend Setup
   Commands:
   cd frontend
   npm install
   ng serve

- Application URL: http://localhost:4200

DEFAULT TEST ACCOUNTS
The database is seeded with the following mock accounts:

Role: Admin
Email: admin@grandplaza.com
Password: Admin@1234!
Name: Admin User

Role: Manager
Email: manager@grandplaza.com
Password: Manager@1234!
Name: Aishath Latheef

Role: Staff
Email: staff@grandplaza.com
Password: Staff@1234!
Name: Mohamed Shifan

Role: Guest
Email: guest@example.com
Password: Guest@1234!
Name: Grace Taylor

PROJECT STRUCTURE
HotelManagementSystem/
|-- backend/ ( .NET 10 Solution )
| |-- HMS.API/ ( API Controllers and Configuration )
| |-- HMS.Application/ ( Business Logic and DTOs )
| |-- HMS.Domain/ ( Entities and Enums )
| |-- HMS.Infrastructure/ ( Data Persistence - EF Core )
| `-- HMS.Tests/          ( Unit and Integration Tests )
|-- frontend/               ( Angular 21 Application )
|-- docs/                   ( UML Diagrams and Documentation )
`-- docker-compose.yml ( Infrastructure orchestration )

DOCUMENTATION
UML diagrams (Use Case, Class, and Sequence diagrams) are located in docs/diagrams/ as PlantUML (.puml) files.

TESTING

- Backend: Run "dotnet test" from the backend folder.
- Frontend: Run "ng test" from the frontend folder.

AUTHORS

- Student Name: [Your Name]
- Student ID: [Your Student ID]
- Module: UFCF8S-30-2 Advanced Software Development
