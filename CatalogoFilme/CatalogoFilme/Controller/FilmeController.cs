using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using CatalogoFilme.Model;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace CatalogoFilme.Controller
{
    [ApiController]
    [Route("[controller]")]
    public class FilmeController : ControllerBase
    {
        private readonly string _cacheFilePath;

        public FilmeController()
        {
            _cacheFilePath = Path.Combine(Directory.GetCurrentDirectory(), "moviesCache.json");
        }

        [HttpGet]
        public async Task<ActionResult<List<Movie>>> GetCache()
        {
            try
            {
                if (!System.IO.File.Exists(_cacheFilePath))
                {
                    await System.IO.File.WriteAllTextAsync(_cacheFilePath, "[]", Encoding.UTF8);
                    return Ok(new List<Movie>());
                }

                var json = await System.IO.File.ReadAllTextAsync(_cacheFilePath, Encoding.UTF8);
                var movies = JsonSerializer.Deserialize<List<Movie>>(json);
                return Ok(movies);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Erro ao ler cache" });
            }
        }

        [HttpPost]
        public async Task<ActionResult> AddToCache([FromBody] List<Movie> newMovies)
        {
            if (newMovies == null || !newMovies.Any())
            {
                return BadRequest(new { Error = "Nenhum filme fornecido" });
            }

            try
            {
                var existingMovies = new List<Movie>();
                if (System.IO.File.Exists(_cacheFilePath))
                {
                    var json = await System.IO.File.ReadAllTextAsync(_cacheFilePath, Encoding.UTF8);
                    existingMovies = JsonSerializer.Deserialize<List<Movie>>(json);
                }

                var existingIds = new HashSet<int>(existingMovies.Select(m => m.Id));
                var filteredMovies = newMovies.Where(m => !existingIds.Contains(m.Id)).ToList();
                existingMovies.AddRange(filteredMovies);

                var options = new JsonSerializerOptions { WriteIndented = true };
                await System.IO.File.WriteAllTextAsync(_cacheFilePath, JsonSerializer.Serialize(existingMovies, options), Encoding.UTF8);
                return Ok(new { Success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Erro ao salvar cache" });
            }
        }
        [HttpGet("search")]
        public async Task<ActionResult<List<Movie>>> SearchCache([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 4)
            {
                return BadRequest(new { Error = "A consulta deve ter pelo menos 4 caracteres" });
            }

            try
            {
                if (!System.IO.File.Exists(_cacheFilePath))
                {
                    return Ok(new List<Movie>());
                }

                var json = await System.IO.File.ReadAllTextAsync(_cacheFilePath, Encoding.UTF8);
                var movies = JsonSerializer.Deserialize<List<Movie>>(json);
                var filteredMovies = movies
                    .Where(m => m.Title != null && m.Title.ToLower().Contains(query.ToLower()))
                    .ToList();
                return Ok(filteredMovies);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Erro ao buscar no cache" });
            }
        }
    }
}
