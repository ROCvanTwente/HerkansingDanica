using System.ComponentModel.DataAnnotations;

namespace StudieplekkenAPI.Models;

public class Student
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(20)]
    public string StudentNumber { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}
