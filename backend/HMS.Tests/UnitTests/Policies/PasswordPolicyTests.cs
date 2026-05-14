// Author: Salaams
using HMS.Application.BusinessRules;

namespace HMS.Tests.UnitTests.Policies;

public class PasswordPolicyTests
{
    // ── Valid passwords ───────────────────────────────────────────────────────

    [Theory]
    [InlineData("Secure#1")]
    [InlineData("Str0ng!Pass")]
    [InlineData("MyP@ssw0rd")]
    [InlineData("C0mpl3x!")]
    public void Validate_ValidPassword_DoesNotThrow(string password)
    {
        var ex = Record.Exception(() => PasswordPolicy.Validate(password));
        Assert.Null(ex);
    }

    // ── Length ────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("Ab1!")]      // 4 chars
    [InlineData("Ab1!xyz")]   // 7 chars
    public void Validate_TooShort_ThrowsInvalidOperation(string password)
    {
        var ex = Assert.Throws<InvalidOperationException>(() => PasswordPolicy.Validate(password));
        Assert.Contains("8 characters", ex.Message);
    }

    // ── Uppercase ─────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_NoUppercase_ThrowsInvalidOperation()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => PasswordPolicy.Validate("secure#1"));
        Assert.Contains("uppercase", ex.Message);
    }

    // ── Lowercase ─────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_NoLowercase_ThrowsInvalidOperation()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => PasswordPolicy.Validate("SECURE#1"));
        Assert.Contains("lowercase", ex.Message);
    }

    // ── Digit ─────────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_NoDigit_ThrowsInvalidOperation()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => PasswordPolicy.Validate("Secure##"));
        Assert.Contains("digit", ex.Message);
    }

    // ── Special character ─────────────────────────────────────────────────────

    [Fact]
    public void Validate_NoSpecialChar_ThrowsInvalidOperation()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => PasswordPolicy.Validate("Secure11"));
        Assert.Contains("special character", ex.Message);
    }

    // ── Exact 8-char boundary ─────────────────────────────────────────────────

    [Fact]
    public void Validate_Exactly8Chars_DoesNotThrow()
    {
        var ex = Record.Exception(() => PasswordPolicy.Validate("Secure#1")); // exactly 8
        Assert.Null(ex);
    }
}
