const kat = require('kickass-torrent-api');
const imdb = require('imdb-api');
const fs = require("fs");

let renewal_period = 1;

console.log(kat.baseURL);
let movies = [];
let to_append = [];

console.log(__dirname);

fs.access('./initialized', (err) => {
    if (!err) {
        renewal_period = 7;
    }
});

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

    fs.readFile("./current_page", "utf8", function(err, contents) {
        contents = Number(contents);
        if (contents == 19) {
            fs.access('./initialized', (err) => {
                if (err) {
                    console.log("First time initialization completed successfully");
                    fs.writeFile("./initialized", "");
                }
            });
            fs.writeFile("./current_page", 0);
        }
        kat.getMovies({ page: contents }).then(
            data => {
                //
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

        fs.writeFile("./current_page", contents + 1);
    });
});