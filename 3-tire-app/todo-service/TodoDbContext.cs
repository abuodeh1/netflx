using Microsoft.EntityFrameworkCore;

namespace TodoService;

public class TodoDbContext : DbContext
{
    public TodoDbContext(DbContextOptions<TodoDbContext> options) : base(options) { }

    public DbSet<Todo> Todos => Set<Todo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Todo>(e =>
        {
            e.ToTable("todos");
            e.Property(t => t.Title).IsRequired().HasMaxLength(200);
            e.HasIndex(t => t.UserId);
        });
    }
}
