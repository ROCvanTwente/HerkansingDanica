using System.ComponentModel.DataAnnotations;

namespace StudieplekkenAPI.Models;

public class StudyPlace
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(20)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Type { get; set; } = string.Empty;

    public bool HasMonitor { get; set; }

    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}
