/*
Import the packages to report the errors
*/
const Sentry = require("@sentry/node");
// or use es6 import statements
// import * as Sentry from '@sentry/node';

const Tracing = require("@sentry/tracing");
// or use es6 import statements
// import * as Tracing from '@sentry/tracing';


Sentry.init({
    dsn: "https://0c10594218a14d21811eac0317e9a76b@o238115.ingest.sentry.io/5727483",

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});



const kat = require('kickass-torrent-api');
var imdb = require('imdb-node-api');
const fs = require("fs");
var phpurlencode = require('phpurlencode');

let renewal_period = 1;

console.log(kat.baseURL);
let movies = [];


let current_dir = __dirname.split("/")
current_dir.splice(-1, 1);
parent_dir = current_dir.join("/");

fs.access(__dirname + '/initialized', (err) => {
    if (!err) {
        renewal_period = 7;
    }
});

fs.readFile(parent_dir + "/movies", "utf8", function(err, contents) {
    if (err) {
        Sentry.captureException(err);
        return null;
    }
    contents.split("\n").forEach((movie) => {
        movie = movie.split(";");
        id = movie[0];
        title = movie[1];
        type = movie[2];
        link = movie[3];
        movies.push(title);
    });

    fs.readFile(__dirname + "/current_page", "utf8", function(err, contents) {
        if (err) {
            Sentry.captureException(err);
        }
        contents = Number(contents);
        if (contents == 19) {
            fs.access(__dirname + '/initialized', (err) => {
                if (err) {
                    console.log("First time initialization completed successfully");
                    fs.writeFile("./initialized", "");
                }
            });
            fs.writeFile(__dirname + "/current_page", 0);
        }
        kat.getMovies({ page: contents }).then(
            data => {
                number = data["total_results"];
                movies = data["results"];
                let current_movie_index = 0;
                movies.forEach(movie => {
                    console.log(current_movie_index + " out of " + number);
                    current_movie_index++;
                    if (movie["torrent magnet link"].indexOf("https://mylink.cx/?url=") < 0) {
                        return;
                    }
                    const magnetlink = phpurlencode.decode(movie["torrent magnet link"].split("https://mylink.cx/?url=")[1].split("&")[0]);
                    console.log(magnetlink);
                    let i = 0;
                    let title = movie["title"].replace(/\./g, m => !i++ ? m : ' ').split(/[0-9][0-9][0-9][0-9]/g)[0];
                    const type = "movie";
                    imdb.searchMovies(phpurlencode.encode(title), function(movies) {
                        let current_movie = movies[0];
                        title = current_movie.title;
                        id = current_movie.id;
                        delete current_movie.title;
                        delete current_movie.id
                        delete current_movie.primaryPhoto

                        fs.appendFile(parent_dir + "/movies", [id, title, type, magnetlink, JSON.stringify(current_movie)].join(";") + "\n", "utf8", Sentry.captureException);
                    }, function(error) {
                        Sentry.captureException(error);
                        console.log(error);
                        return null;
                    });
                });
            }
        ).catch(Sentry.captureException);

        fs.writeFile(__dirname + "/current_page", contents + 1, () => {}, Sentry.captureException);
    });
});