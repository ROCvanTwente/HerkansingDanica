using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudieplekkenAPI.Models;

public class Reservation
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int StudyPlaceId { get; set; }

    [Required]
    [StringLength(100)]
    public string StudentName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string StudentNumber { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "date")]
    public DateOnly Date { get; set; }

    [Required]
    [Column(TypeName = "time")]
    public TimeOnly StartTime { get; set; }

    [Required]
    [Column(TypeName = "time")]
    public TimeOnly EndTime { get; set; }

    [ForeignKey(nameof(StudyPlaceId))]
    public StudyPlace StudyPlace { get; set; } = null!;
}
