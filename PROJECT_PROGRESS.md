# Hotel Management System — Project Progress Report
**Module:** UFCF8S-30-2 Advanced Software Development — UWE Bristol, 2025 Jan  
**Submission:** Part II — Full System Implementation (Task 5)  
**Date:** 14 May 2026

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Domain Model](#3-domain-model)
4. [Spec Compliance Matrix](#4-spec-compliance-matrix)
5. [Security Implementation](#5-security-implementation)
6. [GUI Screens](#6-gui-screens)
7. [Business Rules](#7-business-rules)
8. [API Reference](#8-api-reference)
9. [Database Migrations](#9-database-migrations)
10. [Known Limitations & Decisions](#10-known-limitations--decisions)

---

## 1. System Overview

The Grand Plaza Hotel Management System is a full-stack web application managing the complete hotel lifecycle — from room search and guest booking through staff check-in/out, manager reporting, and admin user governance.

| Layer | Technology |
|---|---|
| Frontend | Angular 21 (standalone components, signal-based reactivity) |
| Backend | ASP.NET Core 10 Web API |
| Database | SQLite via Entity Framework Core (code-first, migrations) |
| Auth | JWT Bearer — token stored in `HttpOnly; Secure; SameSite=Strict` cookie |
| Styling | Tailwind CSS + Angular Material |
| ORM | EF Core with AutoMapper |
| Password hashing | BCrypt |

---

## 2. Architecture

The backend follows a **4-layer clean architecture**:

```
HMS.API          → Controllers, middleware, DI wiring
HMS.Application  → Interfaces, Services, DTOs, Business Rules
HMS.Domain       → Entities, Enums (no dependencies)
HMS.Infrastructure → EF Core DbContext, Repositories, Security
```

The frontend uses **feature-module routing** with lazy-loaded standalone components, role-based route guards, and a cookie-based auth interceptor (`withCredentials: true` on every API request).

---

## 3. Domain Model

### Entities (HMS.Domain.Entities)

| Entity | Key Fields |
|---|---|
| `Hotel` | Id, Name, City, Country, Address, Phone, Email, IsActive |
| `Room` | Id, HotelId, RoomNumber, Type, Capacity, PriceOffPeak, PricePeak, Status, FloorNumber, Description |
| `User` *(base)* | Id, Email, PasswordHash, Role, IsLocked, LockedUntil, FailedLoginAttempts, LastPasswordChange, IsActive |
| `GuestUser` | + FirstName, LastName, Phone, Address |
| `StaffUser` | + FirstName, LastName, EmployeeId, Department |
| `Booking` | Id, GuestId, HotelId, CheckIn/OutDate, Status, TotalAmount, CancellationFee, GuestCount, Notes, CreatedByStaffId |
| `BookingRoom` | BookingId, RoomId, PriceAtBooking *(price locked at booking time)* |
| `BookingService` | BookingId, ServiceId, Quantity, ServiceDate, TotalFee |
| `AncillaryService` | Id, Name, Description, Fee, Unit |
| `Payment` | Id, BookingId, Amount, Method, Status, TransactionRef, ProcessedByStaffId |
| `Invoice` | Id, BookingId, InvoiceNumber, Subtotal, TaxAmount (20% VAT), TotalAmount |
| `InvoiceLineItem` | InvoiceId, Description, Quantity, UnitPrice, LineTotal |
| `AuditLog` | Id, UserId, Action, EntityType, EntityId, Details, IpAddress, Timestamp |
| `PasswordResetToken` | Id, UserId, TokenHash (BCrypt), ExpiresAt (1 h), IsUsed |

### Room Types & Statuses (Enums)

**RoomType:** `StandardDouble`, `DeluxeKing`, `FamilySuite`, `Penthouse`  
**RoomStatus:** `Available`, `Occupied`, `Cleaning`, `OutOfService`  
**BookingStatus:** `Pending`, `Confirmed`, `CheckedIn`, `CheckedOut`, `Cancelled`  
**PaymentStatus:** `Pending`, `Authorised`, `Captured`, `Failed`, `Refunded`  
**UserRole:** `Guest`, `FrontDeskStaff`, `HotelManager`, `Admin`

---

## 4. Spec Compliance Matrix

### 4.1 Domain Requirements

| Spec Requirement | Status | Notes |
|---|---|---|
| Multiple hotel locations | ✅ | Hotels table seeded with multiple cities |
| 4 room types (Standard Double, Deluxe King, Family Suite, Penthouse) | ✅ | Enum + DB seeded |
| Room capacity (2, 2, 4, 4) | ✅ | Capacity field on Room entity |
| Peak / off-peak pricing | ✅ | `PricingPolicy` — peak = Jun–Aug + 20 Dec–5 Jan |
| Ancillary services (Airport Transfer, Breakfast, Spa, Late Check-out) | ✅ | `AncillaryService` table + `ServicesController` |
| Payments & Invoices | ✅ | Full lifecycle: pre-auth on check-in, capture on check-out, 20% VAT |
| Audit logs | ✅ | Written for: login, register, logout, forgot-password, reset-password, check-in, check-out, contact form, deactivate/reactivate user |
| 4 user roles | ✅ | Guest, FrontDeskStaff, HotelManager, Admin |

### 4.2 User Role Capabilities

#### Non-Authenticated Users
| Capability | Status |
|---|---|
| Browse/search available rooms | ✅ `GET /api/rooms/search` (public) |
| View room details | ✅ `GET /api/rooms/{id}` (public) |
| Register as Guest | ✅ `POST /api/auth/register` |
| Login | ✅ `POST /api/auth/login` |
| Forgot/Reset password | ✅ `POST /api/auth/forgot-password` + `reset-password` |
| Submit contact form | ✅ `POST /api/contact` → written to AuditLog |

#### Guest
| Capability | Status |
|---|---|
| Dashboard with real stay stats + loyalty tier | ✅ `GET /api/users/guests/{id}/stats` |
| Create bookings (date/room/guests/services) | ✅ `POST /api/bookings/guest/{id}` |
| View all own bookings | ✅ `GET /api/bookings/guest/{id}` |
| Edit Pending/Confirmed bookings (dates, rooms, guests) | ✅ `PUT /api/bookings/{id}` |
| Add services to Confirmed bookings | ✅ `POST /api/bookings/{id}/services` |
| Remove services from Confirmed bookings | ✅ `DELETE /api/bookings/{id}/services/{serviceId}` |
| Cancel bookings (cancellation fee applied) | ✅ `POST /api/bookings/{id}/cancel` |
| View billing / invoices / payments | ✅ `GET /api/bookings/{id}/invoice` + `payments` |
| Update own profile | ✅ `PUT /api/users/guests/{id}` |
| Payment methods section (placeholder) | ✅ Shown on profile page — "No saved cards" |
| Auto-logout after 15 min inactivity | ✅ InactivityService + countdown dialog |

#### Front Desk Staff
| Capability | Status |
|---|---|
| Staff dashboard | ✅ |
| Check-in (identity confirm, pre-auth payment) | ✅ `POST /api/checkin/{id}/checkin` |
| Check-out (final bill + 20% VAT, invoice, capture payment) | ✅ `POST /api/checkin/{id}/checkout` |
| Walk-in booking for a guest (3-step wizard) | ✅ `/app/staff/walk-in` |
| Guest search by name/email | ✅ `GET /api/users/guests/search?term=` |
| Room status board | ✅ |
| View all hotel bookings | ✅ |

#### Hotel Manager
| Capability | Status |
|---|---|
| Manager dashboard | ✅ |
| Staff roster + performance report (check-ins, check-outs, bookings created) | ✅ `GET /api/reports/staff-performance` |
| Occupancy report (daily/date-range) | ✅ `GET /api/reports/occupancy` |
| Revenue report | ✅ `GET /api/reports/revenue` |
| Check-in / Check-out (same access as staff) | ✅ |
| Walk-in booking | ✅ |

#### Admin
| Capability | Status |
|---|---|
| Admin dashboard | ✅ |
| User management — view all staff | ✅ `GET /api/admin/staff` |
| User management — create staff account | ✅ `POST /api/admin/staff` |
| User management — edit staff (name, dept, role) | ✅ `PUT /api/admin/staff/{id}` |
| User management — view all guests | ✅ `GET /api/admin/guests` |
| Account deactivation / reactivation | ✅ `POST /api/admin/users/{id}/deactivate|reactivate` |
| Account unlock (after lockout) | ✅ `POST /api/admin/users/{id}/unlock` |
| Force password change | ✅ `POST /api/admin/users/{id}/force-password-change` |
| Hotel configuration (name, address, contact, active flag) | ✅ `PUT /api/admin/hotels/{id}` |
| Room pricing configuration (off-peak + peak per room) | ✅ `PUT /api/admin/rooms/{id}/pricing` |
| Audit log viewer | ✅ `GET /api/admin/audit-logs` |
| All staff capabilities | ✅ |

---

## 5. Security Implementation

### 5.1 Authentication

- **JWT** signed with HMAC-SHA256 (`HS256`)
- Token stored in an **`HttpOnly; Secure; SameSite=Strict`** cookie (`hms.auth`) — not accessible to JavaScript, mitigating XSS token theft
- On login/register: cookie appended to response; token body excluded from JSON response (only metadata: `userId`, `role`, `fullName`, `expiresAt`, `email`, `requiresPasswordChange`)
- `POST /api/auth/logout` deletes the cookie server-side
- Angular interceptor adds `withCredentials: true` to every API request (no `Authorization: Bearer` header)
- CORS configured with `AllowCredentials()` and explicit allowed origins

### 5.2 Role-Based Access Control (RBAC)

All protected endpoints use `[Authorize(Roles = "...")]`. Hierarchy:

```
Admin > HotelManager > FrontDeskStaff > Guest
```

Angular `roleGuard` reads the `data.roles` array on each route and redirects to `/auth/login` if the user's role is not in the list.

### 5.3 Password Security

- BCrypt hashing (work factor 12)
- **Password policy enforced** on registration and staff creation:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 digit
  - At least 1 special character

### 5.4 Account Lockout

- **5 failed login attempts** → account locked (`IsLocked = true`, `LockedUntil = UtcNow + 15 min`)
- Locked accounts receive `401 Unauthorized` with a "temporarily locked" message on further login attempts
- Admin can unlock any account via `POST /api/admin/users/{id}/unlock`
- Failed attempts reset to 0 on successful login

### 5.5 Password Reset (Dev/Mock Mode)

- `POST /api/auth/forgot-password` — generates a cryptographically random token encoded as `{userId}.{secret}`, BCrypt-hashes the secret, stores in `PasswordResetTokens` table with 1-hour expiry
- Dev mode: plain token returned in response body (`{ resetToken: "..." }`) — displayed in amber dev-mode box on the frontend forgot-password page for demonstration
- `POST /api/auth/reset-password` — validates token, checks expiry and `IsUsed`, applies password policy, marks token used

### 5.6 Inactivity Auto-Logout

- `InactivityService` (Angular) tracks: `mousemove`, `keydown`, `click`, `scroll`, `touchstart`
- At **13 minutes** of inactivity: opens a `MatDialog` with a live **mm:ss countdown**
- "Stay signed in" button resets all timers
- At **15 minutes**: closes dialog, calls `auth.logout()` → cookie deleted on server

### 5.7 Force Password Change

- Admin can flag any account with `ForcePasswordChangeAsync` (sets `LastPasswordChange = DateTime.MinValue`)
- Frontend redirects to password-change screen on login if `requiresPasswordChange` is true in the session metadata

### 5.8 User Deactivation

- Soft-delete pattern: `User.IsActive` flag (default `true`)
- `LoginAsync` checks `IsActive` and throws `UnauthorizedAccessException` ("Account deactivated") before password verification

### 5.9 Data Protection

- Passwords: BCrypt (never stored in plain text)
- JWT secret: loaded from `appsettings.json` / environment variable — not committed
- Payment simulation: no real card data stored; `TransactionRef` is a generated string

---

## 6. GUI Screens

| Screen | Route | Roles | Status |
|---|---|---|---|
| **Home / Landing** | `/` | All | ✅ |
| **Room Search** | `/rooms/search` | All | ✅ |
| **Room Detail** | `/rooms/:id` | All | ✅ |
| **Contact** | `/contact` | All | ✅ — submits to audit log |
| **Login** | `/auth/login` | — | ✅ |
| **Register** | `/auth/register` | — | ✅ |
| **Forgot Password** | `/auth/forgot-password` | — | ✅ — shows dev token in UI |
| **Reset Password** | `/auth/reset-password?token=` | — | ✅ |
| **Guest Dashboard** | `/app/guest/dashboard` | Guest | ✅ — real tier/spend stats |
| **Booking Wizard** | `/app/guest/booking` | Guest | ✅ — multi-step: hotel→dates→rooms→services→confirm |
| **Bookings List** | `/app/bookings` | All auth | ✅ — edit (Pending/Confirmed), add/remove services (Confirmed) |
| **Billing** | `/app/billing` | Guest, Manager, Admin | ✅ — invoices + payments |
| **Guest Profile** | `/app/guest/profile` | Guest | ✅ — payment methods placeholder |
| **Staff Dashboard** | `/app/staff/dashboard` | Staff, Manager, Admin | ✅ |
| **Check-in Flow** | `/app/staff/checkin` | Staff, Manager, Admin | ✅ — identity confirm, pre-auth payment |
| **Check-out Flow** | `/app/staff/checkout` | Staff, Manager, Admin | ✅ — final bill, 20% VAT, invoice |
| **Walk-in Booking** | `/app/staff/walk-in` | Staff, Manager, Admin | ✅ — guest search → room → confirm |
| **Room Status Board** | `/app/staff/rooms` | Staff, Manager, Admin | ✅ |
| **Manager Dashboard** | `/app/manager/dashboard` | Manager, Admin | ✅ |
| **Reports** | `/app/manager/reports` | Manager, Admin | ✅ — occupancy + revenue |
| **Staff Performance** | `/app/manager/staff` | Manager, Admin | ✅ — real check-in/out counts |
| **Admin Dashboard** | `/app/admin/dashboard` | Admin | ✅ |
| **User Management** | `/app/admin/users` | Admin | ✅ — full CRUD, Staff + Guest tabs |
| **Hotel Configuration** | `/app/admin/config` | Admin | ✅ — hotel details + per-room pricing |
| **Audit Logs** | `/app/admin/audit` | Admin | ✅ |

---

## 7. Business Rules

### 7.1 Room Rates (Spec)

| Room Type | Off-Peak | Peak |
|---|---|---|
| Standard Double | £120 | £180 |
| Deluxe King | £180 | £250 |
| Family Suite | £240 | £320 |
| Penthouse | £500 | £750 |

Rates are stored per-room in the database and configurable via the Admin hotel-config page (`PUT /api/admin/rooms/{id}/pricing`). Peak season: **June–August** and **20 Dec – 5 Jan**.

### 7.2 Cancellation Policy (Spec)

| Window | Fee | Status |
|---|---|---|
| > 14 days before check-in | Free (£0) | ✅ |
| 3–14 days before check-in | 50% of first night's room rate | ✅ |
| < 72 hours before check-in | 100% of first night's room rate | ✅ |
| No-show | 100% of entire booking total | ✅ (available via `CancellationPolicy.NoShowFee`) |

### 7.3 Checkout & Invoicing

1. Staff initiates check-out
2. System recalculates final bill: rooms × nights × nightly rate + all ancillary services
3. **20% VAT** applied to the subtotal
4. Invoice created with line items (one per room, one per service)
5. Pre-authorised payment captured at final amount
6. Booking status set to `CheckedOut`

### 7.4 Guest Loyalty Tiers

| Stays (CheckedOut) | Tier |
|---|---|
| 0–2 | Bronze |
| 3–9 | Silver |
| 10+ | Gold |

Computed dynamically from `GET /api/users/guests/{id}/stats` — displayed on guest dashboard.

### 7.5 Booking Modification Rules

- Only `Pending` or `Confirmed` bookings can be edited
- Dates, rooms, guest count, and notes can be changed
- Total is recalculated on save
- Existing services are preserved; their subtotal is re-added to the new room total
- Rooms from the current booking are always re-selectable (not shown as unavailable against themselves)

### 7.6 Service Management Rules

- Services can only be added to / removed from `Confirmed` bookings (not Pending, CheckedIn, or CheckedOut)
- Service date must fall within the booking's check-in (inclusive) to check-out (exclusive) window

---

## 8. API Reference

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | ❌ | Authenticate user → sets `hms.auth` cookie |
| POST | `/register` | ❌ | Register new guest → sets `hms.auth` cookie |
| POST | `/logout` | ✅ | Delete `hms.auth` cookie |
| POST | `/forgot-password` | ❌ | Generate reset token (dev: returned in body) |
| POST | `/reset-password` | ❌ | Apply new password using reset token |

### Rooms (`/api/rooms`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/search` | ❌ | Cross-hotel room search with filters |
| GET | `/available` | ❌ | Available rooms for a hotel + date range |
| GET | `/{id}` | ❌ | Room detail |
| GET | `/{id}/unavailable-dates` | ❌ | Blocked date ranges for a room |

### Hotels (`/api/hotels`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ❌ | All active hotels |
| GET | `/{id}` | ❌ | Hotel detail |
| GET | `/{id}/rooms` | ✅ | All rooms for a hotel |
| PATCH | `/{id}/rooms/{roomId}/status` | Staff+ | Update room status |

### Bookings (`/api/bookings`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/{id}` | ✅ | Booking detail (guests see own only) |
| GET | `/guest/{guestId}` | ✅ | Guest's bookings |
| GET | `/hotel/{hotelId}` | Staff+ | Hotel's bookings |
| POST | `/guest/{guestId}` | Guest/Staff+ | Create booking |
| PUT | `/{id}` | ✅ | Edit Pending/Confirmed booking |
| POST | `/{id}/cancel` | ✅ | Cancel (fee applied) |
| POST | `/{id}/services` | ✅ | Add ancillary service to Confirmed booking |
| DELETE | `/{id}/services/{serviceId}` | ✅ | Remove service from Confirmed booking |
| GET | `/{id}/payments` | ✅ | Payments on booking |
| GET | `/{id}/invoice` | ✅ | Invoice for booking |

### Check-in (`/api/checkin`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/{id}/checkin` | Staff+ | Check in a Confirmed booking |
| POST | `/{id}/checkout` | Staff+ | Check out, generate invoice, capture payment |

### Users (`/api/users`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/guests/{id}` | ✅ | Guest profile |
| GET | `/guests/{id}/stats` | ✅ | Loyalty stats (stays, spend, tier) |
| GET | `/guests/{id}/bookings` | ✅ | Guest bookings |
| GET | `/guests/search?term=` | Staff+ | Search guests by name/email |
| PUT | `/guests/{id}` | ✅ | Update guest profile |
| GET | `/staff` | Staff+ | All staff |
| GET | `/staff/{id}` | Staff+ | Staff member detail |

### Admin (`/api/admin`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/hotels` | Admin | All hotels |
| PUT | `/hotels/{id}` | Admin | Update hotel details |
| PUT | `/rooms/{id}/pricing` | Admin | Update room pricing |
| GET | `/staff` | Admin | All staff |
| GET | `/staff/{id}` | Admin | Staff detail |
| POST | `/staff` | Admin | Create staff account |
| PUT | `/staff/{id}` | Admin | Update staff |
| GET | `/guests` | Admin | All guests |
| POST | `/users/{id}/deactivate` | Admin | Soft-deactivate account |
| POST | `/users/{id}/reactivate` | Admin | Re-activate account |
| POST | `/users/{id}/unlock` | Admin | Unlock locked account |
| POST | `/users/{id}/force-password-change` | Admin | Flag for password reset |
| GET | `/audit-logs?count=` | Admin | Recent audit log entries |

### Reports (`/api/reports`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/occupancy?hotelId=&from=&to=` | Manager+ | Occupancy stats |
| GET | `/revenue?hotelId=&from=&to=` | Manager+ | Revenue stats |
| GET | `/staff-performance?hotelId=` | Manager+ | Per-staff activity counts |

### Services & Contact

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/services` | ❌ | All active ancillary services |
| GET | `/api/services/{id}` | ❌ | Service detail |
| POST | `/api/contact` | ❌ | Submit contact form (→ AuditLog) |

---

## 9. Database Migrations

| Migration | Date | Change |
|---|---|---|
| `InitialSchema` | 26 Apr 2026 | Full initial schema — all core entities |
| `CheckModelSync` | 26 Apr 2026 | Model alignment fix |
| `AddBookingGuestCount` | 12 May 2026 | Added `GuestCount` column to `Bookings` |
| `AddPasswordResetTokens` | 14 May 2026 | New `PasswordResetTokens` table |
| `AddUserIsActive` | 14 May 2026 | Added `IsActive` column to `Users` |

---

## 10. Known Limitations & Decisions

| Area | Decision / Limitation |
|---|---|
| **Payment processing** | Simulated — no real payment gateway. Pre-auth on check-in, capture on check-out. `TransactionRef` is a generated string. |
| **Password reset delivery** | Dev/mock mode — reset token returned in API response body and shown in UI amber box. In production this would be emailed. |
| **Email notifications** | Not implemented — no SMTP integration. |
| **Room photos** | Not implemented — spec mentions photos but no file storage solution is included. |
| **Preferences / special requests** | Profile page shows a mock "Saved preferences" card — not yet persisted to DB. |
| **CSAT / Handle time metrics** | Labelled "N/A" on staff performance page — not tracked by the system (no ticket/conversation entity). |
| **HSTS** | Enforced by ASP.NET Core's `UseHsts()` in production mode (disabled in development). |
| **Multi-hotel context for staff** | Staff/Manager currently operate on a default hotel (`environment.defaultHotelId`). A hotel-selector could be added for multi-property staff. |
| **No-show policy** | `CancellationPolicy.NoShowFee()` is implemented but no dedicated "mark as no-show" UI exists — treated as a late cancellation in practice. |
| **Card storage** | Spec mentions "payment methods" on guest portal — implemented as a clear placeholder section explaining payments are processed at checkout (no real card storage). |

---

*Document generated: 14 May 2026*
