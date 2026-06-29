using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportSG.Application.Interfaces;
using SportSG.Domain.Enums;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/upload")]
[Authorize]
public class UploadController(IUploadService upload) : ControllerBase
{
    private static readonly HashSet<string> _allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    /// <summary>
    /// Upload ảnh lên Cloudinary. Trả về URL + PublicId để lưu vào entity.
    /// folder: "courts" | "branches" | "partners" | "avatars" | "banners"
    /// </summary>
    [HttpPost("image")]
    public async Task<IActionResult> UploadImage(
        IFormFile file,
        [FromQuery] string folder = "general",
        CancellationToken ct = default)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Không có file được chọn." });

        if (file.Length > MaxFileSizeBytes)
            return BadRequest(new { error = "File không được vượt quá 5 MB." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedExtensions.Contains(ext))
            return BadRequest(new { error = "Chỉ chấp nhận file JPG, PNG, WEBP." });

        // Sanitize folder to prevent path traversal
        folder = folder.Trim('/').Replace("..", "").Replace("\\", "");
        if (string.IsNullOrWhiteSpace(folder)) folder = "general";

        await using var stream = file.OpenReadStream();
        var result = await upload.UploadImageAsync(stream, file.FileName, $"sportsg/{folder}", ct);

        return Ok(new
        {
            url      = result.Url,
            publicId = result.PublicId,
            fileName = file.FileName,
            size     = file.Length,
        });
    }

    /// <summary>
    /// Upload nhiều ảnh cùng lúc (tối đa 10).
    /// </summary>
    [HttpPost("images")]
    public async Task<IActionResult> UploadImages(
        IFormFileCollection files,
        [FromQuery] string folder = "general",
        CancellationToken ct = default)
    {
        if (files.Count == 0)
            return BadRequest(new { error = "Không có file được chọn." });

        if (files.Count > 10)
            return BadRequest(new { error = "Tối đa 10 ảnh mỗi lần upload." });

        var results = new List<object>();
        var errors  = new List<string>();

        foreach (var file in files)
        {
            if (file.Length > MaxFileSizeBytes) { errors.Add($"{file.FileName}: vượt 5 MB"); continue; }
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedExtensions.Contains(ext)) { errors.Add($"{file.FileName}: định dạng không hỗ trợ"); continue; }

            folder = folder.Trim('/').Replace("..", "").Replace("\\", "");
            await using var stream = file.OpenReadStream();
            var result = await upload.UploadImageAsync(stream, file.FileName, $"sportsg/{folder}", ct);
            results.Add(new { url = result.Url, publicId = result.PublicId, fileName = file.FileName });
        }

        return Ok(new { uploaded = results, failed = errors });
    }

    /// <summary>Xóa ảnh khỏi Cloudinary theo publicId.</summary>
    [HttpDelete]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> Delete([FromQuery] string publicId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(publicId))
            return BadRequest(new { error = "publicId là bắt buộc." });

        await upload.DeleteAsync(publicId, ct);
        return NoContent();
    }
}
