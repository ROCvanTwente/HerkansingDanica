using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudieplekkenAPI.Data;
using StudieplekkenAPI.Models;

namespace StudieplekkenAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ReservationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreateReservation([FromBody] CreateReservationRequest request)
    {
        if (request.StudyPlaceId is null || request.Date is null || request.StartTime is null || request.EndTime is null)
        {
            return BadRequest("Alle velden moeten worden ingevuld.");
        }

        if (request.StartTime >= request.EndTime)
        {
            return BadRequest("StartTime moet vóór EndTime liggen.");
        }

        var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == 1 || s.StudentNumber == "S123456");

        if (student is null)
        {
            student = new Student
            {
                StudentNumber = "S123456",
                Name = "Danica"
            };

            _context.Students.Add(student);
            await _context.SaveChangesAsync();
        }

        var isOccupied = await _context.Reservations.AnyAsync(r =>
            r.StudyPlaceId == request.StudyPlaceId.Value &&
            r.Date == request.Date.Value &&
            r.StartTime < request.EndTime.Value &&
            r.EndTime > request.StartTime.Value);

        if (isOccupied)
        {
            return BadRequest("Deze studieplek is op het geselecteerde datum en tijdstip al bezet.");
        }

        var reservation = new Reservation
        {
            StudentId = student.Id,
            StudyPlaceId = request.StudyPlaceId.Value,
            Date = request.Date.Value,
            StartTime = request.StartTime.Value,
            EndTime = request.EndTime.Value
        };

        _context.Reservations.Add(reservation);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(CreateReservation), new { id = reservation.Id }, reservation);
    }
}

public class CreateReservationRequest
{
    public int? StudentId { get; set; }
    public int? StudyPlaceId { get; set; }
    public DateOnly? Date { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
}
