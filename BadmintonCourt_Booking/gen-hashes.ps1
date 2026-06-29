# Chạy script này để lấy BCrypt hash cho file SQL seed
# Usage: .\gen-hashes.ps1

$code = @'
using BCrypt.Net;
Console.WriteLine("-- Admin@123:");
Console.WriteLine(BCrypt.Net.BCrypt.HashPassword("Admin@123", 11));
Console.WriteLine("-- User@123:");
Console.WriteLine(BCrypt.Net.BCrypt.HashPassword("User@123", 11));
'@

$tmpFile = [System.IO.Path]::GetTempFileName() + ".csx"
Set-Content -Path $tmpFile -Value $code

$dllPath = Get-ChildItem -Path "$env:USERPROFILE\.nuget\packages\bcrypt.net-next" -Filter "*.dll" -Recurse |
    Where-Object { $_.FullName -like "*net8*" -or $_.FullName -like "*net6*" } |
    Select-Object -First 1 -ExpandProperty FullName

if (-not $dllPath) {
    Write-Host "Không tìm thấy BCrypt DLL. Dùng dotnet run thay thế..."
    $tmpProj = Join-Path $env:TEMP "HashGen"
    New-Item -ItemType Directory -Force -Path $tmpProj | Out-Null
    @"
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net8.0</TargetFramework></PropertyGroup>
  <ItemGroup><PackageReference Include="BCrypt.Net-Next" Version="4.0.3" /></ItemGroup>
</Project>
"@ | Set-Content "$tmpProj\HashGen.csproj"
    @"
using BCrypt.Net;
Console.WriteLine("Admin@123 hash:");
Console.WriteLine(BCrypt.Net.BCrypt.HashPassword("Admin@123", 11));
Console.WriteLine("User@123 hash:");
Console.WriteLine(BCrypt.Net.BCrypt.HashPassword("User@123", 11));
"@ | Set-Content "$tmpProj\Program.cs"
    dotnet run --project $tmpProj
} else {
    Write-Host "Tìm thấy BCrypt: $dllPath"
}
