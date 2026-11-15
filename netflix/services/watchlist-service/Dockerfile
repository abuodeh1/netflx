# Stage 1: Build and publish
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies first for better layer caching
COPY ["WatchlistService.csproj", "./"]
RUN dotnet restore "WatchlistService.csproj"

# Copy remaining source code and publish
COPY . .
RUN dotnet publish "WatchlistService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080

# Copy published output and run as non-root user
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "WatchlistService.dll"]
