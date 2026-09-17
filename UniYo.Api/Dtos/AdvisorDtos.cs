namespace UniYo.Api.Dtos;

public record AdvisorRequestDto(string ProfId, string OwnerId, string? Pitch);
public record AdvisorRespondDto(string Status, string? ProfId);
