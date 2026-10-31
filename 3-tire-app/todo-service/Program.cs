using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TodoService;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:8082");

builder.Services.AddDbContext<TodoDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// Keep JWT claim names as issued by the Java auth-service ("sub", "username")
JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "auth-service",
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!)),
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

// Code first: create the database and tables from the model if they don't exist
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<TodoDbContext>().Database.EnsureCreated();
}

app.UseAuthentication();
app.UseAuthorization();

static long UserId(ClaimsPrincipal user) => long.Parse(user.FindFirstValue("sub")!);

var todos = app.MapGroup("/api/todos").RequireAuthorization();

todos.MapGet("/", async (ClaimsPrincipal user, TodoDbContext db) =>
{
    var userId = UserId(user);
    return await db.Todos.Where(t => t.UserId == userId)
        .OrderBy(t => t.CreatedAt)
        .ToListAsync();
});

todos.MapPost("/", async (CreateTodo req, ClaimsPrincipal user, TodoDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(req.Title))
        return Results.BadRequest(new { message = "Title is required" });

    var todo = new Todo { UserId = UserId(user), Title = req.Title.Trim() };
    db.Todos.Add(todo);
    await db.SaveChangesAsync();
    return Results.Created($"/api/todos/{todo.Id}", todo);
});

todos.MapPut("/{id:int}", async (int id, UpdateTodo req, ClaimsPrincipal user, TodoDbContext db) =>
{
    var userId = UserId(user);
    var todo = await db.Todos.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
    if (todo is null) return Results.NotFound();

    if (!string.IsNullOrWhiteSpace(req.Title)) todo.Title = req.Title.Trim();
    if (req.IsDone.HasValue) todo.IsDone = req.IsDone.Value;
    await db.SaveChangesAsync();
    return Results.Ok(todo);
});

todos.MapDelete("/{id:int}", async (int id, ClaimsPrincipal user, TodoDbContext db) =>
{
    var userId = UserId(user);
    var todo = await db.Todos.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
    if (todo is null) return Results.NotFound();

    db.Todos.Remove(todo);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();

record CreateTodo(string Title);
record UpdateTodo(string? Title, bool? IsDone);
