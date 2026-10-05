using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace UniYO.Tests;

public class PostTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public PostTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreatePost_WithoutAuth_Returns401Or400()
    {
        var payload = new { content = "automated test post" };
        var res = await _client.PostAsJsonAsync("/api/posts", payload);
        res.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreatePost_WithEmptyContent_Returns400Or401()
    {
        var payload = new { content = "" };
        var res = await _client.PostAsJsonAsync("/api/posts", payload);
        res.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.Unauthorized);
    }
}
