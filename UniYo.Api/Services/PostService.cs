using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;
using UniYo.Api.Entities;

namespace UniYo.Api.Services;

public class PostService
{
    private readonly UniYoDbContext _db;
    public PostService(UniYoDbContext db) => _db = db;

    public async Task<object> BuildPostAsync(Post p, string? viewerId = null)
    {
        var comments = await _db.PostComments
            .Where(c => c.PostId == p.Id)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        var likesCount = await _db.PostLikes.CountAsync(l => l.PostId == p.Id);
        var isLiked = !string.IsNullOrEmpty(viewerId)
            && await _db.PostLikes.AnyAsync(l => l.PostId == p.Id && l.UserId == viewerId);

        return new
        {
            id = p.Id,
            author = new
            {
                id = p.AuthorId,
                name = p.AuthorName,
                university = p.AuthorUniversity,
                avatar = p.AuthorAvatarBase64,
                role = p.AuthorRole,
                verified = p.AuthorVerified
            },
            authorId = p.AuthorId,
            content = p.Content,
            image = TruncateBase64(p.ImageBase64, 100000),
            imageBase64 = TruncateBase64(p.ImageBase64, 100000),
            attachment = (object?)null,
            tags = p.Tags ?? Array.Empty<string>(),
            taggedUserIds = p.TaggedUserIds ?? Array.Empty<string>(),
            likes = likesCount,
            isLiked,
            commentsCount = comments.Count,
            createdAt = p.CreatedAt,
            timestamp = p.CreatedAt.ToString("MMM d, h:mm tt"),
            comments = comments.Select(c => new
            {
                id = c.Id,
                postId = c.PostId,
                authorId = c.AuthorId,
                authorName = c.AuthorName,
                authorAvatar = c.AuthorAvatarBase64,
                content = c.Content,
                time = c.CreatedAt.ToString("h:mm tt")
            })
        };
    }

    private static string? TruncateBase64(string? b64, int maxLength)
    {
        if (string.IsNullOrEmpty(b64)) return null;
        return b64.Length <= maxLength ? b64 : null;
    }
}

