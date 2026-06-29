namespace SportSG.Application.Interfaces;

public record UploadResult(string Url, string PublicId);

public interface IUploadService
{
    Task<UploadResult> UploadImageAsync(Stream stream, string fileName, string folder, CancellationToken ct = default);
    Task DeleteAsync(string publicId, CancellationToken ct = default);
}
