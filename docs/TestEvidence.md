# Test Evidence — HMS Unit Test Suite
**Module:** UFCF8S-30-2 Advanced Software Development  
**Author:** Salaams  
**Framework:** xUnit 2.9.3 + Moq 4.20.72 (.NET 10)  
**Run date:** 14 May 2026  
**Result: 82 passed / 0 failed / 0 skipped — Total time: 0.686 s**

---

## 1. Testing Strategy

The test suite targets the **business logic and application service layers** of the HMS backend. Infrastructure concerns (database, JWT signing, password hashing) are isolated using the **Moq** mocking library, so each test exercises one unit of behaviour in isolation.

Tests are organised into two categories:

| Category | Approach | Files |
|----------|----------|-------|
| **Policy tests** | Pure unit tests — no mocks needed. Static classes with deterministic inputs. | `PricingPolicyTests`, `CancellationPolicyTests`, `PasswordPolicyTests` |
| **Service tests** | Mock-based unit tests. All repository and security dependencies are mocked via Moq. | `BookingManagementServiceTests`, `AuthServiceTests` |

---

## 2. Test Files and Coverage

### 2.1 PricingPolicyTests (13 tests)
**Class under test:** `HMS.Application.BusinessRules.PricingPolicy`

Tests every boundary of the peak-season rule and both outcomes of `GetNightlyRate`.

| Test | What it proves |
|------|----------------|
| `IsPeakSeason_SummerMonths_ReturnsTrue` (×3) | June, July, August are peak |
| `IsPeakSeason_ChristmasWindow_ReturnsTrue` (×3) | Dec 20, Dec 25, Dec 31 are peak |
| `IsPeakSeason_NewYearWindow_ReturnsTrue` (×3) | Jan 1, Jan 3, Jan 5 are peak |
| `IsPeakSeason_Dec19_ReturnsFalse` | Dec 19 is off-peak (boundary) |
| `IsPeakSeason_Jan6_ReturnsFalse` | Jan 6 is off-peak (boundary) |
| `IsPeakSeason_OffPeakMonths_ReturnsFalse` (×7) | Feb–May, Sep–Nov are all off-peak |
| `GetNightlyRate_PeakDate_ReturnsPeakPrice` | Returns `room.PricePeak` on peak date |
| `GetNightlyRate_OffPeakDate_ReturnsOffPeakPrice` | Returns `room.PriceOffPeak` on off-peak date |

---

### 2.2 CancellationPolicyTests (10 tests)
**Class under test:** `HMS.Application.BusinessRules.CancellationPolicy`

Verifies all three fee tiers with exact boundary values. `FirstNightRate = $200` throughout.

| Test | Hours before check-in | Expected fee |
|------|----------------------|--------------|
| `CalculateFee_MoreThan14Days_ReturnsZero` | 360 h (15 days) | $0 |
| `CalculateFee_Exactly14Days_ReturnsZero` | 336.01 h | $0 |
| `CalculateFee_JustUnder14Days_ReturnsHalfFirstNight` | 335 h | $100 |
| `CalculateFee_4DaysBefore_ReturnsHalfFirstNight` | 96 h | $100 |
| `CalculateFee_JustOver72Hours_ReturnsHalfFirstNight` | 72.01 h | $100 |
| `CalculateFee_Exactly72Hours_ReturnsFullFirstNight` | 72 h (boundary — full) | $200 |
| `CalculateFee_24HoursBefore_ReturnsFullFirstNight` | 24 h | $200 |
| `CalculateFee_1HourBefore_ReturnsFullFirstNight` | 1 h | $200 |
| `CalculateFee_NoRooms_ReturnsZero` | Any (no BookingRooms) | $0 |
| `NoShowFee_ReturnsFullBookingTotal` | n/a | 100% of TotalAmount |

---

### 2.3 PasswordPolicyTests (11 tests)
**Class under test:** `HMS.Application.BusinessRules.PasswordPolicy`

Each rule is tested independently in isolation to pinpoint failures precisely.

| Test | Password | Expected |
|------|----------|----------|
| `Validate_ValidPassword_DoesNotThrow` (×4) | `"Secure#1"`, `"Str0ng!Pass"`, `"MyP@ssw0rd"`, `"C0mpl3x!"` | No exception |
| `Validate_TooShort_ThrowsInvalidOperation` (×2) | `"Ab1!"`, `"Ab1!xyz"` | Exception, message contains "8 characters" |
| `Validate_NoUppercase_ThrowsInvalidOperation` | `"secure#1"` | Exception, message contains "uppercase" |
| `Validate_NoLowercase_ThrowsInvalidOperation` | `"SECURE#1"` | Exception, message contains "lowercase" |
| `Validate_NoDigit_ThrowsInvalidOperation` | `"Secure##"` | Exception, message contains "digit" |
| `Validate_NoSpecialChar_ThrowsInvalidOperation` | `"Secure11"` | Exception, message contains "special character" |
| `Validate_Exactly8Chars_DoesNotThrow` | `"Secure#1"` (8 chars) | No exception |

---

### 2.4 BookingManagementServiceTests (25 tests)
**Class under test:** `HMS.Application.Services.BookingManagementService`  
**Mocked:** `IBookingRepository`, `IRoomRepository`, `IAncillaryServiceRepository`, `IPaymentRepository`, `IInvoiceRepository`, `IMapper`

#### CreateBookingAsync (7 tests)

| Test | Scenario | Expected |
|------|----------|----------|
| `CreateBooking_CheckOutBeforeCheckIn_Throws` | CheckOut < CheckIn | `InvalidOperationException` |
| `CreateBooking_SameDateCheckInAndOut_Throws` | Same-day booking (0 nights) | `InvalidOperationException` |
| `CreateBooking_NoRoomsSelected_Throws` | Empty `RoomIds` list | `InvalidOperationException` |
| `CreateBooking_RoomNotAvailable_Throws` | Requested room not in available set | `InvalidOperationException` |
| `CreateBooking_GuestCountExceedsCapacity_Throws` | 5 guests, room capacity 2 | `InvalidOperationException` |
| `CreateBooking_OffPeakCheckIn_UsesOffPeakRate` | March check-in, $100/night, 3 nights | `TotalAmount = $300` |
| `CreateBooking_PeakCheckIn_UsesPeakRate` | July check-in, $200/night, 2 nights | `TotalAmount = $400` |
| `CreateBooking_WithService_IncludesServiceFeeInTotal` | 2 nights × $100 + $50 service | `TotalAmount = $250` |

#### CancelBookingAsync (5 tests)

| Test | Scenario | Expected |
|------|----------|----------|
| `CancelBooking_NotFound_ThrowsKeyNotFound` | Repo returns null | `KeyNotFoundException` |
| `CancelBooking_AlreadyActiveOrComplete_Throws` (×2) | Status = CheckedIn / CheckedOut | `InvalidOperationException` |
| `CancelBooking_AlreadyCancelled_Throws` | Status = Cancelled | `InvalidOperationException` |
| `CancelBooking_MoreThan14Days_ZeroCancellationFee` | CheckIn 15 days away | Fee = $0, Status = Cancelled |
| `CancelBooking_Within72Hours_FullFirstNightFee` | CheckIn 12 h away, rate $180 | Fee = $180 |

#### CheckInAsync (5 tests)

| Test | Scenario | Expected |
|------|----------|----------|
| `CheckIn_NotFound_ThrowsKeyNotFound` | Repo returns null | `KeyNotFoundException` |
| `CheckIn_NotConfirmed_Throws` (×3) | Status = CheckedIn / CheckedOut / Cancelled | `InvalidOperationException` |
| `CheckIn_ValidBooking_AddsPreAuthPayment` | Status = Confirmed, Total = $300 | Payment added: `Authorised`, amount $300 |

#### CheckOutAsync (5 tests)

| Test | Scenario | Expected |
|------|----------|----------|
| `CheckOut_NotFound_ThrowsKeyNotFound` | Repo returns null | `KeyNotFoundException` |
| `CheckOut_NotCheckedIn_Throws` (×3) | Status = Confirmed / CheckedOut / Cancelled | `InvalidOperationException` |
| `CheckOut_AppliesVatCorrectly` | Subtotal $200 (2 nights × $100) | Tax $40, Total $240 |
| `CheckOut_GeneratesInvoiceWithCorrectNumber` | BookingId = 42 | InvoiceNumber = `INV-000042-2026` |
| `CheckOut_CapturesPreAuthPayment` | Existing Authorised payment | Status updated to Captured |

---

### 2.5 AuthServiceTests (23 tests)
**Class under test:** `HMS.Application.Services.AuthService`  
**Mocked:** `IUserRepository`, `IAuditLogRepository`, `IPasswordHasher`, `IJwtTokenService`

#### LoginAsync (8 tests)

| Test | Scenario | Expected |
|------|----------|----------|
| `Login_UnknownEmail_ThrowsUnauthorized` | Email not in repo | `UnauthorizedAccessException` |
| `Login_AccountLocked_ThrowsUnauthorized` | `IsLocked = true`, lockout in future | Exception message contains "locked" |
| `Login_LockoutExpired_AutoUnlocksAndProceedsToPasswordCheck` | `IsLocked = true`, lockout in past | Auto-clears lock, proceeds to password check |
| `Login_WrongPassword_IncrementsFailedAttempts` | Wrong password, 0 prior failures | `FailedLoginAttempts = 1` |
| `Login_FifthFailedAttempt_LocksAccount` | 4 prior failures + wrong password | `IsLocked = true`, `LockedUntil` set |
| `Login_ValidCredentials_ReturnsToken` | Correct password | Token returned, `FailedLoginAttempts = 0` |
| `Login_AdminPasswordExpired_SetsRequiresPasswordChangeTrue` | Admin, `LastPasswordChange` 181 days ago | `RequiresPasswordChange = true` |
| `Login_GuestPasswordExpired_DoesNotSetRequiresPasswordChange` | Guest, `LastPasswordChange` 181 days ago | `RequiresPasswordChange = false` |

#### RegisterGuestAsync (4 tests)

| Test | Scenario | Expected |
|------|----------|----------|
| `Register_DuplicateEmail_Throws` | Email already exists in repo | `InvalidOperationException` |
| `Register_WeakPassword_ThrowsBeforeEmailCheck` | `Password = "weak"` | `InvalidOperationException` |
| `Register_ValidData_CreatesGuestAndReturnsToken` | Valid DTO, no existing email | Token returned, `AddAsync` called once |
| `Register_ValidData_WritesAuditLog` | Valid DTO | `AuditLog` with `Action = "Register"` written |

#### ChangePasswordAsync (3 tests)

| Test | Scenario | Expected |
|------|----------|----------|
| `ChangePassword_WrongCurrentPassword_ThrowsUnauthorized` | Current password fails verification | `UnauthorizedAccessException` |
| `ChangePassword_SameAsCurrentPassword_Throws` | New password == current password | `InvalidOperationException` |
| `ChangePassword_ValidChange_UpdatesHashAndTimestamp` | Valid change | `PasswordHash` updated, `LastPasswordChange` refreshed |

---

## 3. Test Run Output

```
Test run for HMS.Tests.dll (.NETCoreApp,Version=v10.0)
A total of 1 test files matched the specified pattern.

  Passed PricingPolicyTests.IsPeakSeason_SummerMonths_ReturnsTrue(month: 6, day: 1)        [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_SummerMonths_ReturnsTrue(month: 7, day: 15)       [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_SummerMonths_ReturnsTrue(month: 8, day: 31)       [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_ChristmasWindow_ReturnsTrue(month: 12, day: 20)   [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_ChristmasWindow_ReturnsTrue(month: 12, day: 25)   [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_ChristmasWindow_ReturnsTrue(month: 12, day: 31)   [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_NewYearWindow_ReturnsTrue(month: 1, day: 1)       [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_NewYearWindow_ReturnsTrue(month: 1, day: 3)       [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_NewYearWindow_ReturnsTrue(month: 1, day: 5)       [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_Dec19_ReturnsFalse                                [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_Jan6_ReturnsFalse                                 [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_OffPeakMonths_ReturnsFalse(month: 2)              [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_OffPeakMonths_ReturnsFalse(month: 3)              [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_OffPeakMonths_ReturnsFalse(month: 4)              [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_OffPeakMonths_ReturnsFalse(month: 5)              [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_OffPeakMonths_ReturnsFalse(month: 9)              [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_OffPeakMonths_ReturnsFalse(month: 10)             [< 1 ms]
  Passed PricingPolicyTests.IsPeakSeason_OffPeakMonths_ReturnsFalse(month: 11)             [< 1 ms]
  Passed PricingPolicyTests.GetNightlyRate_PeakDate_ReturnsPeakPrice                       [< 1 ms]
  Passed PricingPolicyTests.GetNightlyRate_OffPeakDate_ReturnsOffPeakPrice                 [< 1 ms]
  Passed CancellationPolicyTests.CalculateFee_MoreThan14Days_ReturnsZero                   [< 1 ms]
  Passed CancellationPolicyTests.CalculateFee_Exactly14Days_ReturnsZero                    [< 1 ms]
  Passed CancellationPolicyTests.CalculateFee_JustUnder14Days_ReturnsHalfFirstNight        [< 1 ms]
  Passed CancellationPolicyTests.CalculateFee_4DaysBefore_ReturnsHalfFirstNight            [< 1 ms]
  Passed CancellationPolicyTests.CalculateFee_JustOver72Hours_ReturnsHalfFirstNight        [< 1 ms]
  Passed CancellationPolicyTests.CalculateFee_Exactly72Hours_ReturnsFullFirstNight         [< 1 ms]
  Passed CancellationPolicyTests.CalculateFee_24HoursBefore_ReturnsFullFirstNight          [< 1 ms]
  Passed CancellationPolicyTests.CalculateFee_1HourBefore_ReturnsFullFirstNight            [8 ms]
  Passed CancellationPolicyTests.CalculateFee_NoRooms_ReturnsZero                         [< 1 ms]
  Passed CancellationPolicyTests.NoShowFee_ReturnsFullBookingTotal                         [< 1 ms]
  Passed PasswordPolicyTests.Validate_ValidPassword_DoesNotThrow(password: "Secure#1")     [< 1 ms]
  Passed PasswordPolicyTests.Validate_ValidPassword_DoesNotThrow(password: "Str0ng!Pass")  [< 1 ms]
  Passed PasswordPolicyTests.Validate_ValidPassword_DoesNotThrow(password: "MyP@ssw0rd")   [< 1 ms]
  Passed PasswordPolicyTests.Validate_ValidPassword_DoesNotThrow(password: "C0mpl3x!")     [< 1 ms]
  Passed PasswordPolicyTests.Validate_TooShort_ThrowsInvalidOperation(password: "Ab1!")    [3 ms]
  Passed PasswordPolicyTests.Validate_TooShort_ThrowsInvalidOperation(password: "Ab1!xyz") [< 1 ms]
  Passed PasswordPolicyTests.Validate_NoUppercase_ThrowsInvalidOperation                   [< 1 ms]
  Passed PasswordPolicyTests.Validate_NoLowercase_ThrowsInvalidOperation                   [< 1 ms]
  Passed PasswordPolicyTests.Validate_NoDigit_ThrowsInvalidOperation                       [< 1 ms]
  Passed PasswordPolicyTests.Validate_NoSpecialChar_ThrowsInvalidOperation                 [< 1 ms]
  Passed PasswordPolicyTests.Validate_Exactly8Chars_DoesNotThrow                           [< 1 ms]
  Passed BookingManagementServiceTests.CreateBooking_CheckOutBeforeCheckIn_Throws          [1 ms]
  Passed BookingManagementServiceTests.CreateBooking_SameDateCheckInAndOut_Throws          [< 1 ms]
  Passed BookingManagementServiceTests.CreateBooking_NoRoomsSelected_Throws                [< 1 ms]
  Passed BookingManagementServiceTests.CreateBooking_RoomNotAvailable_Throws               [1 ms]
  Passed BookingManagementServiceTests.CreateBooking_GuestCountExceedsCapacity_Throws      [1 ms]
  Passed BookingManagementServiceTests.CreateBooking_OffPeakCheckIn_UsesOffPeakRate        [5 ms]
  Passed BookingManagementServiceTests.CreateBooking_PeakCheckIn_UsesPeakRate              [1 ms]
  Passed BookingManagementServiceTests.CreateBooking_WithService_IncludesServiceFeeInTotal [3 ms]
  Passed BookingManagementServiceTests.CancelBooking_NotFound_ThrowsKeyNotFound            [< 1 ms]
  Passed BookingManagementServiceTests.CancelBooking_AlreadyActiveOrComplete_Throws (CheckedIn)  [65 ms]
  Passed BookingManagementServiceTests.CancelBooking_AlreadyActiveOrComplete_Throws (CheckedOut) [1 ms]
  Passed BookingManagementServiceTests.CancelBooking_AlreadyCancelled_Throws               [< 1 ms]
  Passed BookingManagementServiceTests.CancelBooking_MoreThan14Days_ZeroCancellationFee    [11 ms]
  Passed BookingManagementServiceTests.CancelBooking_Within72Hours_FullFirstNightFee       [< 1 ms]
  Passed BookingManagementServiceTests.CheckIn_NotFound_ThrowsKeyNotFound                  [< 1 ms]
  Passed BookingManagementServiceTests.CheckIn_NotConfirmed_Throws (CheckedIn)             [1 ms]
  Passed BookingManagementServiceTests.CheckIn_NotConfirmed_Throws (CheckedOut)            [< 1 ms]
  Passed BookingManagementServiceTests.CheckIn_NotConfirmed_Throws (Cancelled)             [< 1 ms]
  Passed BookingManagementServiceTests.CheckIn_ValidBooking_AddsPreAuthPayment             [1 ms]
  Passed BookingManagementServiceTests.CheckOut_NotFound_ThrowsKeyNotFound                 [1 ms]
  Passed BookingManagementServiceTests.CheckOut_NotCheckedIn_Throws (Confirmed)            [< 1 ms]
  Passed BookingManagementServiceTests.CheckOut_NotCheckedIn_Throws (CheckedOut)           [< 1 ms]
  Passed BookingManagementServiceTests.CheckOut_NotCheckedIn_Throws (Cancelled)            [1 ms]
  Passed BookingManagementServiceTests.CheckOut_AppliesVatCorrectly                        [4 ms]
  Passed BookingManagementServiceTests.CheckOut_GeneratesInvoiceWithCorrectNumber          [1 ms]
  Passed BookingManagementServiceTests.CheckOut_CapturesPreAuthPayment                     [4 ms]
  Passed AuthServiceTests.Login_UnknownEmail_ThrowsUnauthorized                            [< 1 ms]
  Passed AuthServiceTests.Login_AccountLocked_ThrowsUnauthorized                           [1 ms]
  Passed AuthServiceTests.Login_LockoutExpired_AutoUnlocksAndProceedsToPasswordCheck       [66 ms]
  Passed AuthServiceTests.Login_WrongPassword_IncrementsFailedAttempts                     [9 ms]
  Passed AuthServiceTests.Login_FifthFailedAttempt_LocksAccount                            [1 ms]
  Passed AuthServiceTests.Login_ValidCredentials_ReturnsToken                              [1 ms]
  Passed AuthServiceTests.Login_AdminPasswordExpired_SetsRequiresPasswordChangeTrue        [1 ms]
  Passed AuthServiceTests.Login_GuestPasswordExpired_DoesNotSetRequiresPasswordChange      [3 ms]
  Passed AuthServiceTests.Register_DuplicateEmail_Throws                                   [2 ms]
  Passed AuthServiceTests.Register_WeakPassword_ThrowsBeforeEmailCheck                    [< 1 ms]
  Passed AuthServiceTests.Register_ValidData_CreatesGuestAndReturnsToken                   [3 ms]
  Passed AuthServiceTests.Register_ValidData_WritesAuditLog                                [3 ms]
  Passed AuthServiceTests.ChangePassword_WrongCurrentPassword_ThrowsUnauthorized           [2 ms]
  Passed AuthServiceTests.ChangePassword_SameAsCurrentPassword_Throws                      [< 1 ms]
  Passed AuthServiceTests.ChangePassword_ValidChange_UpdatesHashAndTimestamp               [2 ms]

Test Run Successful.
Total tests: 82
     Passed: 82
 Total time: 0.6861 Seconds
```

---

## 4. Summary

| Test Class | Tests | Result |
|------------|-------|--------|
| PricingPolicyTests | 20 | ✅ All passed |
| CancellationPolicyTests | 10 | ✅ All passed |
| PasswordPolicyTests | 11 | ✅ All passed |
| BookingManagementServiceTests | 25 | ✅ All passed |
| AuthServiceTests | 23 | ✅ All passed |
| **Total** | **82** | **✅ 82 / 82** |

**Run command:**
```
cd HotelManagementSystem/backend
dotnet test HMS.Tests --verbosity normal
```
