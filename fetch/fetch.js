const kat = require('kickass-torrent-api');
const imdb = require('imdb-api');
const fs = require("fs");
const { title } = require('node:process');


let movies = [];
let to_append = [];

fs.readFile("../movies", "utf8", function(err, contents) {
    if (err) {
        return console.log(err);
    }
    contents.split("\n").forEach((movie) => {
        movie = movie.split(";");
        id = movie[0];
        title = movie[1];
        type = movie[2];
        link = movie[3];
        movies.push(title);
    });
    kat.getMovies().then(
        data => {
            number = data["total_results"];
            movies = data["results"];
            movies.forEach(movie => {
                if (movie["torrent magnet link"].indexOf("https://mylink.cx/?url=") < 0) {
                    return;
                }
                const magnetlink = movie["torrent magnet link"].split("https://mylink.cx/?url=") //[1].split("&")[0];
                let i = 0;
                const title = movie["title"].replace(/\./g, m => !i++ ? m : ' ');
                const type = "movie"
                if (movies.indexOf(title) == -1) {

                }
            });
        }
    );
});