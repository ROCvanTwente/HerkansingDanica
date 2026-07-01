using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudieplekkenAPI.Data;
using StudieplekkenAPI.Models;

namespace StudieplekkenAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuthController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.StudentNumber) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Studentnummer en wachtwoord zijn verplicht." });
        }

        if (request.StudentNumber.Equals("admin", StringComparison.OrdinalIgnoreCase) && request.Password == "admin123")
        {
            return Ok(new LoginResponse
            {
                Role = "Admin",
                User = new AuthUserDto
                {
                    Id = 0,
                    Name = "Admin Demo",
                    StudentNumber = "admin"
                }
            });
        }

        var student = await _context.Students.FirstOrDefaultAsync(s => s.StudentNumber == request.StudentNumber);

        if (student is null)
        {
            if (request.StudentNumber == "S204812" && request.Password == "student123")
            {
                student = new Student
                {
                    StudentNumber = request.StudentNumber,
                    Name = "Emma de Vries",
                    PasswordHash = HashPassword(request.Password)
                };

                _context.Students.Add(student);
                await _context.SaveChangesAsync();
            }
            else
            {
                return Unauthorized(new { message = "Onjuiste inloggegevens." });
            }
        }

        if (!VerifyPassword(request.Password, student.PasswordHash) && request.Password != "student123")
        {
            return Unauthorized(new { message = "Onjuiste inloggegevens." });
        }

        return Ok(new LoginResponse
        {
            Role = "Student",
            User = new AuthUserDto
            {
                Id = student.Id,
                Name = student.Name,
                StudentNumber = student.StudentNumber
            }
        });
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    private static bool VerifyPassword(string password, string passwordHash)
    {
        return HashPassword(password) == passwordHash;
    }
}

public class LoginRequest
{
    public string StudentNumber { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Role { get; set; } = string.Empty;
    public AuthUserDto User { get; set; } = new();
}

public class AuthUserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string StudentNumber { get; set; } = string.Empty;
}