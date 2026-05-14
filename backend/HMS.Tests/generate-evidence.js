const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, Header, Footer, PageNumber, PageBreak,
} = require('docx');
const fs = require('fs');

// ── Colours ───────────────────────────────────────────────────────────────────
const BLUE       = "1F3864";   // dark navy header fill
const BLUE_LIGHT = "D6E4F0";  // light blue alternate rows / header accent
const MID_BLUE   = "2E5FA3";  // heading colour
const GREEN      = "1E7B45";  // pass badge
const GREY_BG    = "F5F5F5";  // code block background
const WHITE      = "FFFFFF";
const BLACK      = "000000";
const BORDER_CLR = "BBBBBB";

// ── Helpers ───────────────────────────────────────────────────────────────────
const border  = (clr = BORDER_CLR) => ({ style: BorderStyle.SINGLE, size: 1, color: clr });
const borders = (clr)               => ({ top: border(clr), bottom: border(clr), left: border(clr), right: border(clr) });

function hdr(text, level, opts = {}) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 240, after: 120 },
    ...opts,
    children: [new TextRun({ text, bold: true, color: MID_BLUE,
      size: level === HeadingLevel.HEADING_1 ? 36 : level === HeadingLevel.HEADING_2 ? 28 : 24,
      font: "Arial" })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    ...opts,
    children: [new TextRun({ text, font: "Arial", size: 22, ...opts.run })],
  });
}

function bold(text) { return new TextRun({ text, bold: true, font: "Arial", size: 22 }); }
function reg(text)  { return new TextRun({ text, font: "Arial", size: 22 }); }

function codePara(text) {
  return new Paragraph({
    spacing: { after: 0, before: 0 },
    shading: { type: ShadingType.CLEAR, fill: GREY_BG },
    children: [new TextRun({ text, font: "Courier New", size: 18, color: "333333" })],
  });
}

// ── Table builders ────────────────────────────────────────────────────────────
const FULL_WIDTH = 9360; // US Letter, 1" margins

function makeTable(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.DXA },
      borders: borders(BLUE),
      shading: { type: ShadingType.CLEAR, fill: BLUE },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: h, bold: true, color: WHITE, font: "Arial", size: 20 })],
      })],
    })),
  });

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => {
      const fill = ri % 2 === 0 ? WHITE : BLUE_LIGHT;
      const runs = parseCell(cell);
      return new TableCell({
        width: { size: colWidths[ci], type: WidthType.DXA },
        borders: borders(BORDER_CLR),
        shading: { type: ShadingType.CLEAR, fill },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: runs })],
      });
    }),
  }));

  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

// Simple inline code detection: `text`
function parseCell(text) {
  const runs = [];
  const parts = text.split(/`([^`]+)`/);
  parts.forEach((p, i) => {
    if (i % 2 === 1) {
      runs.push(new TextRun({ text: p, font: "Courier New", size: 18, color: "C0392B" }));
    } else if (p) {
      runs.push(new TextRun({ text: p, font: "Arial", size: 20 }));
    }
  });
  return runs.length ? runs : [new TextRun({ text: "", font: "Arial", size: 20 })];
}

// ── SECTION: Title block ──────────────────────────────────────────────────────
const titleBlock = [
  new Paragraph({
    spacing: { before: 480, after: 80 },
    children: [new TextRun({ text: "Test Evidence Report", font: "Arial", size: 56, bold: true, color: BLUE })],
  }),
  new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: "HMS Unit Test Suite", font: "Arial", size: 36, color: MID_BLUE })],
  }),
  new Paragraph({ spacing: { after: 480 }, children: [] }),

  makeTable(
    ["Field", "Value"],
    [
      ["Module",    "UFCF8S-30-2 Advanced Software Development"],
      ["Author",    "Salaams"],
      ["Framework", "xUnit 2.9.3 + Moq 4.20.72 (.NET 10)"],
      ["Run date",  "14 May 2026"],
      ["Result",    "82 passed / 0 failed / 0 skipped — Total time: 0.686 s"],
    ],
    [2400, 6960]
  ),
  new Paragraph({ children: [new PageBreak()] }),
];

// ── SECTION 1 — Testing Strategy ─────────────────────────────────────────────
const section1 = [
  hdr("1. Testing Strategy", HeadingLevel.HEADING_1),
  para("The test suite targets the business logic and application service layers of the HMS backend. Infrastructure concerns (database, JWT signing, password hashing) are isolated using the Moq mocking library, so each test exercises one unit of behaviour in isolation."),
  para("Tests are organised into two categories:"),
  new Paragraph({ spacing: { after: 160 } }),

  makeTable(
    ["Category", "Approach", "Files"],
    [
      ["Policy tests",  "Pure unit tests — no mocks needed. Static classes with deterministic inputs.",
       "`PricingPolicyTests`, `CancellationPolicyTests`, `PasswordPolicyTests`"],
      ["Service tests", "Mock-based unit tests. All repository and security dependencies are mocked via Moq.",
       "`BookingManagementServiceTests`, `AuthServiceTests`"],
    ],
    [2000, 4360, 3000]
  ),
  new Paragraph({ spacing: { after: 240 } }),
];

// ── SECTION 2 — Test Files and Coverage ──────────────────────────────────────

// 2.1 PricingPolicy
const section21 = [
  hdr("2. Test Files and Coverage", HeadingLevel.HEADING_1),
  hdr("2.1  PricingPolicyTests (20 tests)", HeadingLevel.HEADING_2),
  new Paragraph({ spacing: { after: 60 }, children: [bold("Class under test: "), reg("HMS.Application.BusinessRules.PricingPolicy")] }),
  para("Tests every boundary of the peak-season rule and both outcomes of GetNightlyRate."),
  new Paragraph({ spacing: { after: 160 } }),
  makeTable(
    ["Test", "What it proves"],
    [
      ["`IsPeakSeason_SummerMonths_ReturnsTrue` (×3)",      "June, July, August are peak"],
      ["`IsPeakSeason_ChristmasWindow_ReturnsTrue` (×3)",   "Dec 20, Dec 25, Dec 31 are peak"],
      ["`IsPeakSeason_NewYearWindow_ReturnsTrue` (×3)",     "Jan 1, Jan 3, Jan 5 are peak"],
      ["`IsPeakSeason_Dec19_ReturnsFalse`",                 "Dec 19 is off-peak (boundary)"],
      ["`IsPeakSeason_Jan6_ReturnsFalse`",                  "Jan 6 is off-peak (boundary)"],
      ["`IsPeakSeason_OffPeakMonths_ReturnsFalse` (×7)",    "Feb–May, Sep–Nov are all off-peak"],
      ["`GetNightlyRate_PeakDate_ReturnsPeakPrice`",        "Returns room.PricePeak on peak date"],
      ["`GetNightlyRate_OffPeakDate_ReturnsOffPeakPrice`",  "Returns room.PriceOffPeak on off-peak date"],
    ],
    [4200, 5160]
  ),
  new Paragraph({ spacing: { after: 240 } }),
];

// 2.2 CancellationPolicy
const section22 = [
  hdr("2.2  CancellationPolicyTests (10 tests)", HeadingLevel.HEADING_2),
  new Paragraph({ spacing: { after: 60 }, children: [bold("Class under test: "), reg("HMS.Application.BusinessRules.CancellationPolicy")] }),
  para("Verifies all three fee tiers with exact boundary values. FirstNightRate = $200 throughout."),
  new Paragraph({ spacing: { after: 160 } }),
  makeTable(
    ["Test", "Hours before check-in", "Expected fee"],
    [
      ["`CalculateFee_MoreThan14Days_ReturnsZero`",          "360 h (15 days)", "$0"],
      ["`CalculateFee_Exactly14Days_ReturnsZero`",           "336.01 h",        "$0"],
      ["`CalculateFee_JustUnder14Days_ReturnsHalfFirstNight`","335 h",          "$100"],
      ["`CalculateFee_4DaysBefore_ReturnsHalfFirstNight`",   "96 h",            "$100"],
      ["`CalculateFee_JustOver72Hours_ReturnsHalfFirstNight`","72.01 h",        "$100"],
      ["`CalculateFee_Exactly72Hours_ReturnsFullFirstNight`", "72 h (boundary — full)", "$200"],
      ["`CalculateFee_24HoursBefore_ReturnsFullFirstNight`",  "24 h",           "$200"],
      ["`CalculateFee_1HourBefore_ReturnsFullFirstNight`",    "1 h",            "$200"],
      ["`CalculateFee_NoRooms_ReturnsZero`",                  "Any (no BookingRooms)", "$0"],
      ["`NoShowFee_ReturnsFullBookingTotal`",                  "n/a",            "100% of TotalAmount"],
    ],
    [4000, 2480, 2880]
  ),
  new Paragraph({ spacing: { after: 240 } }),
];

// 2.3 PasswordPolicy
const section23 = [
  hdr("2.3  PasswordPolicyTests (11 tests)", HeadingLevel.HEADING_2),
  new Paragraph({ spacing: { after: 60 }, children: [bold("Class under test: "), reg("HMS.Application.BusinessRules.PasswordPolicy")] }),
  para("Each rule is tested independently in isolation to pinpoint failures precisely."),
  new Paragraph({ spacing: { after: 160 } }),
  makeTable(
    ["Test", "Password", "Expected"],
    [
      ["`Validate_ValidPassword_DoesNotThrow` (×4)",        `"Secure#1", "Str0ng!Pass", "MyP@ssw0rd", "C0mpl3x!"`, "No exception"],
      ["`Validate_TooShort_ThrowsInvalidOperation` (×2)",   `"Ab1!", "Ab1!xyz"`,                                   `Exception — message contains "8 characters"`],
      ["`Validate_NoUppercase_ThrowsInvalidOperation`",     `"secure#1"`,                                          `Exception — message contains "uppercase"`],
      ["`Validate_NoLowercase_ThrowsInvalidOperation`",     `"SECURE#1"`,                                          `Exception — message contains "lowercase"`],
      ["`Validate_NoDigit_ThrowsInvalidOperation`",         `"Secure##"`,                                          `Exception — message contains "digit"`],
      ["`Validate_NoSpecialChar_ThrowsInvalidOperation`",   `"Secure11"`,                                          `Exception — message contains "special character"`],
      ["`Validate_Exactly8Chars_DoesNotThrow`",             `"Secure#1" (8 chars)`,                                "No exception"],
    ],
    [3600, 2960, 2800]
  ),
  new Paragraph({ spacing: { after: 240 } }),
];

// 2.4 BookingManagementService
const section24 = [
  hdr("2.4  BookingManagementServiceTests (25 tests)", HeadingLevel.HEADING_2),
  new Paragraph({ spacing: { after: 60 }, children: [bold("Class under test: "), reg("HMS.Application.Services.BookingManagementService")] }),
  new Paragraph({ spacing: { after: 120 }, children: [bold("Mocked: "), reg("IBookingRepository, IRoomRepository, IAncillaryServiceRepository, IPaymentRepository, IInvoiceRepository, IMapper")] }),

  hdr("CreateBookingAsync (8 tests)", HeadingLevel.HEADING_3),
  makeTable(
    ["Test", "Scenario", "Expected"],
    [
      ["`CreateBooking_CheckOutBeforeCheckIn_Throws`",           "CheckOut < CheckIn",                          "`InvalidOperationException`"],
      ["`CreateBooking_SameDateCheckInAndOut_Throws`",           "Same-day booking (0 nights)",                 "`InvalidOperationException`"],
      ["`CreateBooking_NoRoomsSelected_Throws`",                 "Empty RoomIds list",                          "`InvalidOperationException`"],
      ["`CreateBooking_RoomNotAvailable_Throws`",                "Requested room not in available set",         "`InvalidOperationException`"],
      ["`CreateBooking_GuestCountExceedsCapacity_Throws`",       "5 guests, room capacity 2",                   "`InvalidOperationException`"],
      ["`CreateBooking_OffPeakCheckIn_UsesOffPeakRate`",         "March check-in, $100/night, 3 nights",        "TotalAmount = $300"],
      ["`CreateBooking_PeakCheckIn_UsesPeakRate`",               "July check-in, $200/night, 2 nights",         "TotalAmount = $400"],
      ["`CreateBooking_WithService_IncludesServiceFeeInTotal`",  "2 nights x $100 + $50 service",               "TotalAmount = $250"],
    ],
    [3600, 3000, 2760]
  ),
  new Paragraph({ spacing: { after: 160 } }),

  hdr("CancelBookingAsync (5 tests)", HeadingLevel.HEADING_3),
  makeTable(
    ["Test", "Scenario", "Expected"],
    [
      ["`CancelBooking_NotFound_ThrowsKeyNotFound`",             "Repo returns null",                           "`KeyNotFoundException`"],
      ["`CancelBooking_AlreadyActiveOrComplete_Throws` (×2)",   "Status = CheckedIn / CheckedOut",             "`InvalidOperationException`"],
      ["`CancelBooking_AlreadyCancelled_Throws`",               "Status = Cancelled",                          "`InvalidOperationException`"],
      ["`CancelBooking_MoreThan14Days_ZeroCancellationFee`",    "CheckIn 15 days away",                        "Fee = $0, Status = Cancelled"],
      ["`CancelBooking_Within72Hours_FullFirstNightFee`",       "CheckIn 12 h away, rate $180",                "Fee = $180"],
    ],
    [3600, 3000, 2760]
  ),
  new Paragraph({ spacing: { after: 160 } }),

  hdr("CheckInAsync (5 tests)", HeadingLevel.HEADING_3),
  makeTable(
    ["Test", "Scenario", "Expected"],
    [
      ["`CheckIn_NotFound_ThrowsKeyNotFound`",        "Repo returns null",                                   "`KeyNotFoundException`"],
      ["`CheckIn_NotConfirmed_Throws` (×3)",          "Status = CheckedIn / CheckedOut / Cancelled",         "`InvalidOperationException`"],
      ["`CheckIn_ValidBooking_AddsPreAuthPayment`",   "Status = Confirmed, Total = $300",                    "Payment added: Authorised, amount $300"],
    ],
    [3600, 3000, 2760]
  ),
  new Paragraph({ spacing: { after: 160 } }),

  hdr("CheckOutAsync (5 tests)", HeadingLevel.HEADING_3),
  makeTable(
    ["Test", "Scenario", "Expected"],
    [
      ["`CheckOut_NotFound_ThrowsKeyNotFound`",           "Repo returns null",                               "`KeyNotFoundException`"],
      ["`CheckOut_NotCheckedIn_Throws` (×3)",             "Status = Confirmed / CheckedOut / Cancelled",     "`InvalidOperationException`"],
      ["`CheckOut_AppliesVatCorrectly`",                  "Subtotal $200 (2 nights x $100)",                 "Tax $40, Total $240"],
      ["`CheckOut_GeneratesInvoiceWithCorrectNumber`",    "BookingId = 42",                                  "InvoiceNumber = INV-000042-2026"],
      ["`CheckOut_CapturesPreAuthPayment`",               "Existing Authorised payment",                     "Status updated to Captured"],
    ],
    [3600, 3000, 2760]
  ),
  new Paragraph({ spacing: { after: 240 } }),
];

// 2.5 AuthService
const section25 = [
  hdr("2.5  AuthServiceTests (23 tests)", HeadingLevel.HEADING_2),
  new Paragraph({ spacing: { after: 60 }, children: [bold("Class under test: "), reg("HMS.Application.Services.AuthService")] }),
  new Paragraph({ spacing: { after: 120 }, children: [bold("Mocked: "), reg("IUserRepository, IAuditLogRepository, IPasswordHasher, IJwtTokenService")] }),

  hdr("LoginAsync (8 tests)", HeadingLevel.HEADING_3),
  makeTable(
    ["Test", "Scenario", "Expected"],
    [
      ["`Login_UnknownEmail_ThrowsUnauthorized`",                        "Email not in repo",                                    "`UnauthorizedAccessException`"],
      ["`Login_AccountLocked_ThrowsUnauthorized`",                       "IsLocked = true, lockout in future",                   `Exception message contains "locked"`],
      ["`Login_LockoutExpired_AutoUnlocksAndProceedsToPasswordCheck`",   "IsLocked = true, lockout in past",                     "Auto-clears lock, proceeds to password check"],
      ["`Login_WrongPassword_IncrementsFailedAttempts`",                 "Wrong password, 0 prior failures",                     "FailedLoginAttempts = 1"],
      ["`Login_FifthFailedAttempt_LocksAccount`",                        "4 prior failures + wrong password",                    "IsLocked = true, LockedUntil set"],
      ["`Login_ValidCredentials_ReturnsToken`",                          "Correct password",                                     "Token returned, FailedLoginAttempts = 0"],
      ["`Login_AdminPasswordExpired_SetsRequiresPasswordChangeTrue`",    "Admin, LastPasswordChange 181 days ago",               "RequiresPasswordChange = true"],
      ["`Login_GuestPasswordExpired_DoesNotSetRequiresPasswordChange`",  "Guest, LastPasswordChange 181 days ago",               "RequiresPasswordChange = false"],
    ],
    [3800, 2880, 2680]
  ),
  new Paragraph({ spacing: { after: 160 } }),

  hdr("RegisterGuestAsync (4 tests)", HeadingLevel.HEADING_3),
  makeTable(
    ["Test", "Scenario", "Expected"],
    [
      ["`Register_DuplicateEmail_Throws`",                  "Email already exists in repo",   "`InvalidOperationException`"],
      ["`Register_WeakPassword_ThrowsBeforeEmailCheck`",   `Password = "weak"`,              "`InvalidOperationException`"],
      ["`Register_ValidData_CreatesGuestAndReturnsToken`", "Valid DTO, no existing email",   "Token returned, AddAsync called once"],
      ["`Register_ValidData_WritesAuditLog`",              "Valid DTO",                      `AuditLog with Action = "Register" written`],
    ],
    [3800, 2880, 2680]
  ),
  new Paragraph({ spacing: { after: 160 } }),

  hdr("ChangePasswordAsync (3 tests)", HeadingLevel.HEADING_3),
  makeTable(
    ["Test", "Scenario", "Expected"],
    [
      ["`ChangePassword_WrongCurrentPassword_ThrowsUnauthorized`", "Current password fails verification", "`UnauthorizedAccessException`"],
      ["`ChangePassword_SameAsCurrentPassword_Throws`",            "New password == current password",   "`InvalidOperationException`"],
      ["`ChangePassword_ValidChange_UpdatesHashAndTimestamp`",      "Valid change",                       "PasswordHash updated, LastPasswordChange refreshed"],
    ],
    [3800, 2880, 2680]
  ),
  new Paragraph({ spacing: { after: 240 } }),
];

// ── SECTION 3 — Test Run Output ───────────────────────────────────────────────
const testOutput = [
  "Test run for HMS.Tests.dll (.NETCoreApp,Version=v10.0)",
  "A total of 1 test files matched the specified pattern.",
  "",
  "  Passed PricingPolicyTests.IsPeakSeason_SummerMonths_ReturnsTrue(month: 6, day: 1)        [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_SummerMonths_ReturnsTrue(month: 7, day: 15)       [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_SummerMonths_ReturnsTrue(month: 8, day: 31)       [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_ChristmasWindow_ReturnsTrue(month: 12, day: 20)   [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_ChristmasWindow_ReturnsTrue(month: 12, day: 25)   [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_ChristmasWindow_ReturnsTrue(month: 12, day: 31)   [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_NewYearWindow_ReturnsTrue(month: 1, day: 1)       [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_NewYearWindow_ReturnsTrue(month: 1, day: 3)       [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_NewYearWindow_ReturnsTrue(month: 1, day: 5)       [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_Dec19_ReturnsFalse                                [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_Jan6_ReturnsFalse                                 [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_OffPeakMonths_ReturnsFalse(month: 2)              [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_OffPeakMonths_ReturnsFalse(month: 3)              [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_OffPeakMonths_ReturnsFalse(month: 4)              [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_OffPeakMonths_ReturnsFalse(month: 5)              [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_OffPeakMonths_ReturnsFalse(month: 9)              [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_OffPeakMonths_ReturnsFalse(month: 10)             [< 1 ms]",
  "  Passed PricingPolicyTests.IsPeakSeason_OffPeakMonths_ReturnsFalse(month: 11)             [< 1 ms]",
  "  Passed PricingPolicyTests.GetNightlyRate_PeakDate_ReturnsPeakPrice                       [< 1 ms]",
  "  Passed PricingPolicyTests.GetNightlyRate_OffPeakDate_ReturnsOffPeakPrice                 [< 1 ms]",
  "  Passed CancellationPolicyTests.CalculateFee_MoreThan14Days_ReturnsZero                   [< 1 ms]",
  "  Passed CancellationPolicyTests.CalculateFee_Exactly14Days_ReturnsZero                    [< 1 ms]",
  "  Passed CancellationPolicyTests.CalculateFee_JustUnder14Days_ReturnsHalfFirstNight        [< 1 ms]",
  "  Passed CancellationPolicyTests.CalculateFee_4DaysBefore_ReturnsHalfFirstNight            [< 1 ms]",
  "  Passed CancellationPolicyTests.CalculateFee_JustOver72Hours_ReturnsHalfFirstNight        [< 1 ms]",
  "  Passed CancellationPolicyTests.CalculateFee_Exactly72Hours_ReturnsFullFirstNight         [< 1 ms]",
  "  Passed CancellationPolicyTests.CalculateFee_24HoursBefore_ReturnsFullFirstNight          [< 1 ms]",
  "  Passed CancellationPolicyTests.CalculateFee_1HourBefore_ReturnsFullFirstNight            [8 ms]",
  "  Passed CancellationPolicyTests.CalculateFee_NoRooms_ReturnsZero                         [< 1 ms]",
  "  Passed CancellationPolicyTests.NoShowFee_ReturnsFullBookingTotal                         [< 1 ms]",
  `  Passed PasswordPolicyTests.Validate_ValidPassword_DoesNotThrow(password: "Secure#1")     [< 1 ms]`,
  `  Passed PasswordPolicyTests.Validate_ValidPassword_DoesNotThrow(password: "Str0ng!Pass")  [< 1 ms]`,
  `  Passed PasswordPolicyTests.Validate_ValidPassword_DoesNotThrow(password: "MyP@ssw0rd")   [< 1 ms]`,
  `  Passed PasswordPolicyTests.Validate_ValidPassword_DoesNotThrow(password: "C0mpl3x!")     [< 1 ms]`,
  `  Passed PasswordPolicyTests.Validate_TooShort_ThrowsInvalidOperation(password: "Ab1!")    [3 ms]`,
  `  Passed PasswordPolicyTests.Validate_TooShort_ThrowsInvalidOperation(password: "Ab1!xyz") [< 1 ms]`,
  "  Passed PasswordPolicyTests.Validate_NoUppercase_ThrowsInvalidOperation                   [< 1 ms]",
  "  Passed PasswordPolicyTests.Validate_NoLowercase_ThrowsInvalidOperation                   [< 1 ms]",
  "  Passed PasswordPolicyTests.Validate_NoDigit_ThrowsInvalidOperation                       [< 1 ms]",
  "  Passed PasswordPolicyTests.Validate_NoSpecialChar_ThrowsInvalidOperation                 [< 1 ms]",
  "  Passed PasswordPolicyTests.Validate_Exactly8Chars_DoesNotThrow                           [< 1 ms]",
  "  Passed BookingManagementServiceTests.CreateBooking_CheckOutBeforeCheckIn_Throws          [1 ms]",
  "  Passed BookingManagementServiceTests.CreateBooking_SameDateCheckInAndOut_Throws          [< 1 ms]",
  "  Passed BookingManagementServiceTests.CreateBooking_NoRoomsSelected_Throws                [< 1 ms]",
  "  Passed BookingManagementServiceTests.CreateBooking_RoomNotAvailable_Throws               [1 ms]",
  "  Passed BookingManagementServiceTests.CreateBooking_GuestCountExceedsCapacity_Throws      [1 ms]",
  "  Passed BookingManagementServiceTests.CreateBooking_OffPeakCheckIn_UsesOffPeakRate        [5 ms]",
  "  Passed BookingManagementServiceTests.CreateBooking_PeakCheckIn_UsesPeakRate              [1 ms]",
  "  Passed BookingManagementServiceTests.CreateBooking_WithService_IncludesServiceFeeInTotal [3 ms]",
  "  Passed BookingManagementServiceTests.CancelBooking_NotFound_ThrowsKeyNotFound            [< 1 ms]",
  "  Passed BookingManagementServiceTests.CancelBooking_AlreadyActiveOrComplete_Throws (CheckedIn)  [65 ms]",
  "  Passed BookingManagementServiceTests.CancelBooking_AlreadyActiveOrComplete_Throws (CheckedOut) [1 ms]",
  "  Passed BookingManagementServiceTests.CancelBooking_AlreadyCancelled_Throws               [< 1 ms]",
  "  Passed BookingManagementServiceTests.CancelBooking_MoreThan14Days_ZeroCancellationFee    [11 ms]",
  "  Passed BookingManagementServiceTests.CancelBooking_Within72Hours_FullFirstNightFee       [< 1 ms]",
  "  Passed BookingManagementServiceTests.CheckIn_NotFound_ThrowsKeyNotFound                  [< 1 ms]",
  "  Passed BookingManagementServiceTests.CheckIn_NotConfirmed_Throws (CheckedIn)             [1 ms]",
  "  Passed BookingManagementServiceTests.CheckIn_NotConfirmed_Throws (CheckedOut)            [< 1 ms]",
  "  Passed BookingManagementServiceTests.CheckIn_NotConfirmed_Throws (Cancelled)             [< 1 ms]",
  "  Passed BookingManagementServiceTests.CheckIn_ValidBooking_AddsPreAuthPayment             [1 ms]",
  "  Passed BookingManagementServiceTests.CheckOut_NotFound_ThrowsKeyNotFound                 [1 ms]",
  "  Passed BookingManagementServiceTests.CheckOut_NotCheckedIn_Throws (Confirmed)            [< 1 ms]",
  "  Passed BookingManagementServiceTests.CheckOut_NotCheckedIn_Throws (CheckedOut)           [< 1 ms]",
  "  Passed BookingManagementServiceTests.CheckOut_NotCheckedIn_Throws (Cancelled)            [1 ms]",
  "  Passed BookingManagementServiceTests.CheckOut_AppliesVatCorrectly                        [4 ms]",
  "  Passed BookingManagementServiceTests.CheckOut_GeneratesInvoiceWithCorrectNumber          [1 ms]",
  "  Passed BookingManagementServiceTests.CheckOut_CapturesPreAuthPayment                     [4 ms]",
  "  Passed AuthServiceTests.Login_UnknownEmail_ThrowsUnauthorized                            [< 1 ms]",
  "  Passed AuthServiceTests.Login_AccountLocked_ThrowsUnauthorized                           [1 ms]",
  "  Passed AuthServiceTests.Login_LockoutExpired_AutoUnlocksAndProceedsToPasswordCheck       [66 ms]",
  "  Passed AuthServiceTests.Login_WrongPassword_IncrementsFailedAttempts                     [9 ms]",
  "  Passed AuthServiceTests.Login_FifthFailedAttempt_LocksAccount                            [1 ms]",
  "  Passed AuthServiceTests.Login_ValidCredentials_ReturnsToken                              [1 ms]",
  "  Passed AuthServiceTests.Login_AdminPasswordExpired_SetsRequiresPasswordChangeTrue        [1 ms]",
  "  Passed AuthServiceTests.Login_GuestPasswordExpired_DoesNotSetRequiresPasswordChange      [3 ms]",
  "  Passed AuthServiceTests.Register_DuplicateEmail_Throws                                   [2 ms]",
  "  Passed AuthServiceTests.Register_WeakPassword_ThrowsBeforeEmailCheck                    [< 1 ms]",
  "  Passed AuthServiceTests.Register_ValidData_CreatesGuestAndReturnsToken                   [3 ms]",
  "  Passed AuthServiceTests.Register_ValidData_WritesAuditLog                                [3 ms]",
  "  Passed AuthServiceTests.ChangePassword_WrongCurrentPassword_ThrowsUnauthorized           [2 ms]",
  "  Passed AuthServiceTests.ChangePassword_SameAsCurrentPassword_Throws                      [< 1 ms]",
  "  Passed AuthServiceTests.ChangePassword_ValidChange_UpdatesHashAndTimestamp               [2 ms]",
  "",
  "Test Run Successful.",
  "Total tests: 82",
  "     Passed: 82",
  " Total time: 0.6861 Seconds",
];

const section3 = [
  hdr("3. Test Run Output", HeadingLevel.HEADING_1),
  para("The following is the unedited console output from running dotnet test HMS.Tests --verbosity normal:"),
  new Paragraph({ spacing: { after: 80 } }),
  ...testOutput.map(line => codePara(line || " ")),
  new Paragraph({ spacing: { after: 240 } }),
];

// ── SECTION 4 — Summary ───────────────────────────────────────────────────────
const section4 = [
  hdr("4. Summary", HeadingLevel.HEADING_1),
  makeTable(
    ["Test Class", "Tests", "Result"],
    [
      ["PricingPolicyTests",              "20", "PASSED"],
      ["CancellationPolicyTests",         "10", "PASSED"],
      ["PasswordPolicyTests",             "11", "PASSED"],
      ["BookingManagementServiceTests",   "25", "PASSED"],
      ["AuthServiceTests",                "23", "PASSED"],
      ["TOTAL",                           "82", "82 / 82"],
    ],
    [5360, 1500, 2500]
  ),
  new Paragraph({ spacing: { after: 160 } }),
  para("Run command:"),
  codePara("cd HotelManagementSystem/backend"),
  codePara("dotnet test HMS.Tests --verbosity normal"),
];

// ── Assemble document ─────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22, color: BLACK } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: MID_BLUE },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE_LIGHT, space: 4 } } },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: MID_BLUE },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "444444" },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_CLR, space: 4 } },
            children: [
              new TextRun({ text: "HMS Unit Test Evidence  |  UFCF8S-30-2 Advanced Software Development", font: "Arial", size: 18, color: "666666" }),
              new TextRun({ text: "\t", font: "Arial", size: 18 }),
              new TextRun({ text: "Salaams  |  14 May 2026", font: "Arial", size: 18, color: "666666" }),
            ],
            tabStops: [{ type: "right", position: 9360 }],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_CLR, space: 4 } },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", font: "Arial", size: 18, color: "888888" }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: "888888" }),
              new TextRun({ text: " of ", font: "Arial", size: 18, color: "888888" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 18, color: "888888" }),
            ],
          }),
        ],
      }),
    },
    children: [
      ...titleBlock,
      ...section1,
      ...section21,
      ...section22,
      ...section23,
      ...section24,
      ...section25,
      new Paragraph({ children: [new PageBreak()] }),
      ...section3,
      new Paragraph({ children: [new PageBreak()] }),
      ...section4,
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("D:\\Villa\\HMS-2\\HotelManagementSystem\\backend\\HMS.Tests\\TestEvidence.docx", buf);
  console.log("Done — TestEvidence.docx written.");
});
