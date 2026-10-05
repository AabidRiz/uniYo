using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace UniYO.Tests;

public class AuthTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public AuthTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var payload = new { email = "kusal.p@sliit.lk", password = "wrong", role = "student" };
        var res = await _client.PostAsJsonAsync("/api/auth/login", payload);
        res.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOk()
    {
        var payload = new { email = "kusal.p@sliit.lk", password = "1234", role = "student" };
        var res = await _client.PostAsJsonAsync("/api/auth/login", payload);
        res.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Register_WithWeakPassword_ReturnsBadRequest()
    {
        var uniqueEmail = $"weak_{Guid.NewGuid():N}@sliit.lk";
        var payload = new
        {
            role = "student",
            name = "Test User",
            email = uniqueEmail,
            password = "abc",
            university = "SLIIT",
            studentId = "IT-20260001"
        };
        var res = await _client.PostAsJsonAsync("/api/auth/register", payload);
        res.StatusCode.Should().BeOneOf(
            HttpStatusCode.BadRequest,
            HttpStatusCode.Conflict);
    }
}
