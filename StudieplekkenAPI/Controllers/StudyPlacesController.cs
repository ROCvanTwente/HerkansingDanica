using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudieplekkenAPI.Data;
using StudieplekkenAPI.Models;

namespace StudieplekkenAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudyPlacesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StudyPlacesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<StudyPlace>>> GetStudyPlaces()
        {
            var places = await _context.StudyPlaces.ToListAsync();
            return Ok(places);
        }

        [HttpPost]
        public async Task<ActionResult<StudyPlace>> PostStudyPlace(CreateStudyPlaceRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Type))
            {
                return BadRequest("Code en type zijn verplicht.");
            }

            var studyPlace = new StudyPlace
            {
                Code = request.Code.Trim(),
                Type = request.Type.Trim(),
                HasMonitor = request.HasMonitor
            };

            _context.StudyPlaces.Add(studyPlace);
            await _context.SaveChangesAsync();

            // Direct het aangemaakte object succesvol terugsturen naar de frontend
            return Ok(studyPlace);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> PutStudyPlace(int id, CreateStudyPlaceRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Type))
            {
                return BadRequest("Code en type zijn verplicht.");
            }

            var studyPlace = await _context.StudyPlaces.FindAsync(id);

            if (studyPlace is null)
            {
                return NotFound(new { message = "De studieplek is niet gevonden." });
            }

            // Gegevens van de bestaande plek overschrijven met de nieuwe waarden
            studyPlace.Code = request.Code.Trim();
            studyPlace.Type = request.Type.Trim();
            studyPlace.HasMonitor = request.HasMonitor;

            await _context.SaveChangesAsync();

            return NoContent(); // HTTP 204: Succesvol bijgewerkt zonder extra data terug te sturen
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteStudyPlace(int id)
        {
            var studyPlace = await _context.StudyPlaces.FindAsync(id);

            if (studyPlace is null)
            {
                return NotFound(new { message = "De studieplek is niet gevonden." });
            }

            _context.StudyPlaces.Remove(studyPlace);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class CreateStudyPlaceRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public bool HasMonitor { get; set; }
    }
}