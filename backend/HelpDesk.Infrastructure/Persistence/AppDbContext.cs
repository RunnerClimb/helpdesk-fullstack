using HelpDesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;




namespace HelpDesk.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
     
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Ticket>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Title).IsRequired().HasMaxLength(120);
            e.Property(t => t.Description).IsRequired().HasMaxLength(2000);
            e.Property(t => t.Priority).HasConversion<string>();
            e.Property(t => t.Status).HasConversion<string>();
            e.HasOne(t => t.CreatedBy)
             .WithMany(u => u.Tickets)
             .HasForeignKey(t => t.CreatedById)
             .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Comment>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Text).IsRequired().HasMaxLength(1000);
            e.HasOne(c => c.Ticket)
             .WithMany(t => t.Comments)
             .HasForeignKey(c => c.TicketId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(c => c.CreatedBy)
             .WithMany(u => u.Comments)
             .HasForeignKey(c => c.CreatedById)
             .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.Email).IsRequired().HasMaxLength(200);
            e.Property(u => u.DisplayName).IsRequired().HasMaxLength(100);
            e.HasIndex(u => u.Email).IsUnique();
        });

        // Seed usuario por defecto para pruebas
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Email = "admin@helpdesk.com",
            DisplayName = "Administrador"
        });
    }
}