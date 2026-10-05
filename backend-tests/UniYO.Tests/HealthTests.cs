using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace UniYO.Tests;

public class HealthTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public HealthTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Health_Endpoint_Returns200()
    {
        var res = await _client.GetAsync("/api/health");
        res.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUniversities_Returns200()
    {
        var res = await _client.GetAsync("/api/universities");
        res.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetPosts_Returns200()
    {
        var res = await _client.GetAsync("/api/posts");
        res.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetProjects_Returns200()
    {
        var res = await _client.GetAsync("/api/projects");
        res.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetProfessors_Returns200()
    {
        var res = await _client.GetAsync("/api/professors");
        res.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetInternships_Returns200()
    {
        var res = await _client.GetAsync("/api/internships");
        res.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
