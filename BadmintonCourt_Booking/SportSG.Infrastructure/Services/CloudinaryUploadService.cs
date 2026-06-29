using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using SportSG.Application.Interfaces;
using AppUploadResult = SportSG.Application.Interfaces.UploadResult;

namespace SportSG.Infrastructure.Services;

public class CloudinaryUploadService(IConfiguration cfg, ILogger<CloudinaryUploadService> logger) : IUploadService
{
    private readonly Cloudinary _cloudinary = new(new Account(
        cfg["Cloudinary:CloudName"],
        cfg["Cloudinary:ApiKey"],
        cfg["Cloudinary:ApiSecret"]));

    public async Task<AppUploadResult> UploadImageAsync(Stream stream, string fileName, string folder, CancellationToken ct = default)
    {
        var uploadParams = new ImageUploadParams
        {
            File       = new FileDescription(fileName, stream),
            Folder     = folder,
            UseFilename = false,
            UniqueFilename = true,
            Overwrite  = false,
        };

        var result = await _cloudinary.UploadAsync(uploadParams, ct);
        if (result.Error is not null)
        {
            logger.LogError("Cloudinary upload error: {Msg}", result.Error.Message);
            throw new InvalidOperationException($"Upload failed: {result.Error.Message}");
        }

        return new AppUploadResult(result.SecureUrl.ToString(), result.PublicId);
    }

    public async Task DeleteAsync(string publicId, CancellationToken ct = default)
    {
        var result = await _cloudinary.DestroyAsync(new DeletionParams(publicId));
        if (result.Result != "ok")
            logger.LogWarning("Cloudinary delete returned: {Result} for {PublicId}", result.Result, publicId);
    }
}
