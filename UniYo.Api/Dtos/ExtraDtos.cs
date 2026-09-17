namespace UniYo.Api.Dtos;

public record AddImpressionDto(string StudentId, int? Rating, string? Comment);
public record DeleteSessionDto(string ActorId);
public record EnrollVideoDto(string StudentId);
public record PayVideoDto(string StudentId, string? CardName, string? CardNumber, string? CardExpiry, string? CardCvv);
public record UpdateInvestmentDto(string? Status, string? MeetingSlot, string? AiSummary);
