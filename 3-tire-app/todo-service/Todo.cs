namespace TodoService;

public class Todo
{
    public int Id { get; set; }
    public long UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsDone { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
