FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

WORKDIR /src

COPY ["SportSG.sln", "./"]
COPY ["SportSG.API/SportSG.API.csproj", "SportSG.API/"]
COPY ["SportSG.Application/SportSG.Application.csproj", "SportSG.Application/"]
COPY ["SportSG.Domain/SportSG.Domain.csproj", "SportSG.Domain/"]
COPY ["SportSG.Infrastructure/SportSG.Infrastructure.csproj", "SportSG.Infrastructure/"]

RUN dotnet restore "SportSG.sln"

COPY . .

WORKDIR /src/SportSG.API
RUN dotnet publish "SportSG.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0

WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "SportSG.API.dll"]