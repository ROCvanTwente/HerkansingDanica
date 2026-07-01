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

        // GET: api/StudyPlaces
        // Dit endpoint wordt door je React frontend aangeroepen om de tabel te vullen
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StudyPlace>>> GetStudyPlaces()
        {
            var places = await _context.StudyPlaces.ToListAsync();
            return Ok(places);
        }

        // POST: api/StudyPlaces
        // Hiermee kun je via Swagger handmatig studieplekken toevoegen
        [HttpPost]
        public async Task<ActionResult<StudyPlace>> PostStudyPlace(StudyPlace studyPlace)
        {
            if (string.IsNullOrWhiteSpace(studyPlace.Code) || string.IsNullOrWhiteSpace(studyPlace.Type))
            {
                return BadRequest("Code en type zijn verplicht.");
            }

            _context.StudyPlaces.Add(studyPlace);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetStudyPlaces), new { id = studyPlace.Id }, studyPlace);
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
}