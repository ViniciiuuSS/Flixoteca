using Microsoft.AspNetCore.Mvc;

namespace CatalogoFilme.Model
{
    public class Movie
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Release_date { get; set; }
        public string Overview { get; set; }
        public string Poster_path { get; set; }
        public float vote_average { get; set; }
        public int vote_count { get; set; }
    }
}
