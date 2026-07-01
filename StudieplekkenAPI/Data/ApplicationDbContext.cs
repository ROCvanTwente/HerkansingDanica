using Microsoft.EntityFrameworkCore;
using StudieplekkenAPI.Models;

namespace StudieplekkenAPI.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Student> Students => Set<Student>();
    public DbSet<StudyPlace> StudyPlaces => Set<StudyPlace>();
    public DbSet<Reservation> Reservations => Set<Reservation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Reservation>()
            .HasOne(r => r.StudyPlace)
            .WithMany(p => p.Reservations)
            .HasForeignKey(r => r.StudyPlaceId)
            .OnDelete(DeleteBehavior.Cascade);

        base.OnModelCreating(modelBuilder);
    }
}
