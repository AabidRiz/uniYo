using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniYo.Api.Data;
using UniYo.Api.Dtos;
using UniYo.Api.Entities;
using UniYo.Api.Services;

namespace UniYo.Api.Controllers;

[ApiController]
[Route("api/posts")]
public class PostsController : ControllerBase
{
    private readonly UniYoDbContext _db;
    private readonly PostService _posts;
    public PostsController(UniYoDbContext db, PostService posts) { _db = db; _posts = posts; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? viewerId)
    {
        var rows = await _db.Posts.OrderByDescending(p => p.CreatedAt).ToListAsync();
        var list = new List<object>();
        foreach (var p in rows) list.Add(await _posts.BuildPostAsync(p, viewerId));
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePostDto dto)
    {
        if (string.IsNullOrEmpty(dto.Content) && string.IsNullOrEmpty(dto.ImageBase64) && string.IsNullOrEmpty(dto.AttachmentBase64))
            return BadRequest(new { error = "Content required" });

        if (string.IsNullOrEmpty(dto.AuthorId)) return BadRequest(new { error = "AuthorId required" });

        var author = await _db.Users.FindAsync(dto.AuthorId);
        if (author == null) return BadRequest(new { error = "Invalid author" });

        var p = new Post
        {
            Id = $"post_{DateTime.UtcNow.Ticks}",
            AuthorId = author.Id,
            AuthorName = author.Name,
            AuthorUniversity = author.UniversityName,
            AuthorAvatarBase64 = author.AvatarBase64,
            AuthorRole = author.Role,
            AuthorVerified = author.Verified,
            Content = dto.Content ?? "",
            ImageBase64 = dto.ImageBase64,
            AttachmentBase64 = dto.AttachmentBase64,
            AttachmentName = dto.AttachmentName,
            Tags = (dto.Tags != null && dto.Tags.Length > 0) ? dto.Tags : new[] { "#UniYO" },
            TaggedUserIds = dto.TaggedUserIds ?? Array.Empty<string>(),
            LikesCount = 0,
            CommentsCount = 0,
            CreatedAt = DateTime.UtcNow
        };
        _db.Posts.Add(p);
        await _db.SaveChangesAsync();
        return StatusCode(201, await _posts.BuildPostAsync(p, author.Id));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdatePostDto dto)
    {
        var p = await _db.Posts.FindAsync(id);
        if (p == null) return NotFound();
        if (dto.Content != null) p.Content = dto.Content;
        if (dto.Tags != null) p.Tags = dto.Tags;
        await _db.SaveChangesAsync();
        return Ok(await _posts.BuildPostAsync(p));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var p = await _db.Posts.FindAsync(id);
        if (p == null) return NotFound();
        var comments = _db.PostComments.Where(c => c.PostId == id);
        var likes = _db.PostLikes.Where(l => l.PostId == id);
        _db.PostComments.RemoveRange(comments);
        _db.PostLikes.RemoveRange(likes);
        _db.Posts.Remove(p);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }

    [HttpPost("{id}/like")]
    public async Task<IActionResult> ToggleLike(string id, [FromBody] LikeDto dto)
    {
        if (string.IsNullOrEmpty(dto.UserId)) return BadRequest(new { error = "userId required" });
        var p = await _db.Posts.FindAsync(id);
        if (p == null) return NotFound();

        var existing = await _db.PostLikes.FirstOrDefaultAsync(l => l.PostId == id && l.UserId == dto.UserId);
        if (existing != null)
        {
            _db.PostLikes.Remove(existing);
        }
        else
        {
            _db.PostLikes.Add(new PostLike { PostId = id, UserId = dto.UserId });
        }
        await _db.SaveChangesAsync();
        return Ok(await _posts.BuildPostAsync(p, dto.UserId));
    }

    [HttpGet("{id}/comments")]
    public async Task<IActionResult> GetComments(string id)
    {
        var rows = await _db.PostComments
            .Where(c => c.PostId == id)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();
        return Ok(rows.Select(c => new
        {
            id = c.Id,
            postId = c.PostId,
            authorId = c.AuthorId,
            authorName = c.AuthorName,
            authorAvatar = c.AuthorAvatarBase64,
            content = c.Content,
            time = c.CreatedAt.ToString("h:mm tt")
        }));
    }

    [HttpPost("{id}/comments")]
    public async Task<IActionResult> AddComment(string id, [FromBody] CommentDto dto)
    {
        if (string.IsNullOrEmpty(dto.Content)) return BadRequest(new { error = "Content required" });
        var author = await _db.Users.FindAsync(dto.AuthorId);
        if (author == null) return BadRequest(new { error = "Invalid author" });

        var c = new PostComment
        {
            Id = $"cmt_{DateTime.UtcNow.Ticks}",
            PostId = id,
            AuthorId = author.Id,
            AuthorName = author.Name,
            AuthorAvatarBase64 = author.AvatarBase64,
            Content = dto.Content,
            CreatedAt = DateTime.UtcNow
        };
        _db.PostComments.Add(c);
        var p = await _db.Posts.FindAsync(id);
        if (p != null) p.CommentsCount = await _db.PostComments.CountAsync(x => x.PostId == id) + 1;
        await _db.SaveChangesAsync();

        return StatusCode(201, new
        {
            id = c.Id,
            postId = c.PostId,
            authorId = c.AuthorId,
            authorName = c.AuthorName,
            authorAvatar = c.AuthorAvatarBase64,
            content = c.Content,
            time = c.CreatedAt.ToString("h:mm tt")
        });
    }

    [HttpDelete("{postId}/comments/{commentId}")]
    public async Task<IActionResult> DeleteComment(string postId, string commentId)
    {
        var c = await _db.PostComments.FirstOrDefaultAsync(x => x.Id == commentId && x.PostId == postId);
        if (c == null) return NotFound();
        _db.PostComments.Remove(c);
        var p = await _db.Posts.FindAsync(postId);
        if (p != null)
        {
            p.CommentsCount = await _db.PostComments.CountAsync(x => x.PostId == postId) - 1;
            if (p.CommentsCount < 0) p.CommentsCount = 0;
        }
        await _db.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }
}
