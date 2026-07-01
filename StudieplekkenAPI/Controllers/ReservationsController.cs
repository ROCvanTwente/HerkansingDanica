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

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReservationSummaryDto>>> GetReservations()
    {
        var reservations = await _context.Reservations
            .Include(r => r.StudyPlace)
            .OrderByDescending(r => r.Date)
            .ThenBy(r => r.StartTime)
            .ToListAsync();

        var result = reservations.Select(r => new ReservationSummaryDto
        {
            Id = r.Id,
            StudyPlaceId = r.StudyPlaceId,
            StudentName = r.StudentName,
            StudentNumber = r.StudentNumber,
            Date = r.Date,
            StartTime = r.StartTime,
            EndTime = r.EndTime,
            StudyPlaceCode = r.StudyPlace?.Code,
            StudyPlaceType = r.StudyPlace?.Type
        }).ToList();

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateReservation([FromBody] CreateReservationRequest request)
    {
        if (request.StudyPlaceId is null || string.IsNullOrWhiteSpace(request.StudentName) || string.IsNullOrWhiteSpace(request.StudentNumber) || request.Date is null || request.StartTime is null || request.EndTime is null)
        {
            return BadRequest("Alle velden zijn verplicht.");
        }

        var vandaag = DateOnly.FromDateTime(DateTime.Today);
        
        // 1. Controleer of de datum in het verleden ligt
        if (request.Date.Value < vandaag)
        {
            return BadRequest("Je kunt geen reservering maken voor een datum in het verleden.");
        }

        // 2. Controleer of de tijd VANDAAG al voorbij is (zonder te kijken naar seconden)
        if (request.Date.Value == vandaag)
        {
            var nu = DateTime.Now;
            // We maken een TimeOnly van de huidige uren en minuten (seconden op 0)
            var nuTijdZonderSeconden = new TimeOnly(nu.Hour, nu.Minute); 
            
            if (request.StartTime.Value < nuTijdZonderSeconden)
            {
                return BadRequest("De gekozen starttijd is vandaag al voorbij.");
            }
        }

        if (request.StartTime >= request.EndTime)
        {
            return BadRequest("De starttijd moet vóór de eindtijd liggen.");
        }

        var studyPlace = await _context.StudyPlaces.FindAsync(request.StudyPlaceId.Value);
        if (studyPlace is null)
        {
            return NotFound(new { message = "De geselecteerde studieplek is niet gevonden." });
        }

        var overlap = await _context.Reservations.AnyAsync(r =>
            r.StudyPlaceId == request.StudyPlaceId.Value &&
            r.Date == request.Date.Value &&
            r.StartTime < request.EndTime.Value &&
            r.EndTime > request.StartTime.Value);

        if (overlap)
        {
            return BadRequest("Deze studieplek is op het geselecteerde datum en tijdstip al bezet.");
        }

        var reservation = new Reservation
        {
            StudyPlaceId = studyPlace.Id,
            StudentName = request.StudentName.Trim(),
            StudentNumber = request.StudentNumber.Trim(),
            Date = request.Date.Value,
            StartTime = request.StartTime.Value,
            EndTime = request.EndTime.Value
        };

        _context.Reservations.Add(reservation);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(CreateReservation), new { id = reservation.Id }, reservation);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteReservation(int id)
    {
        var reservation = await _context.Reservations.FindAsync(id);

        if (reservation is null)
        {
            return NotFound(new { message = "De reservering is niet gevonden." });
        }

        _context.Reservations.Remove(reservation);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class CreateReservationRequest
{
    public int? StudyPlaceId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentNumber { get; set; } = string.Empty;
    public DateOnly? Date { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
}

public class ReservationSummaryDto
{
    public int Id { get; set; }
    public int StudyPlaceId { get; set; }
    public string? StudentName { get; set; }
    public string? StudentNumber { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string? StudyPlaceCode { get; set; }
    public string? StudyPlaceType { get; set; }
}