const kat = require('kickass-torrent-api');
const phpurlencode = require('phpurlencode');
const async = require('async');
const magnet = require("magnet-uri");
var imdbId = require('imdb-id');

function fromMagnet(name, type, uri) {
    const parsed = magnet.decode(uri);
    const infoHash = parsed.infoHash.toLowerCase();
    const tags = [];
    if (uri.match(/720p/i)) tags.push("720p");
    if (uri.match(/1080p/i)) tags.push("1080p");
    return {
        name: name,
        type: type,
        infoHash: infoHash,
        sources: (parsed.announce || []).map(function(x) { return "tracker:" + x }).concat(["dht:" + infoHash]),
        tag: tags,
        title: name, // show quality in the UI
    }
}

function select(result) {
    let magnet = result.page_link.split("url=");
    if (magnet[0] !== "https://mylink.cx/?")
        return;
    magnet = phpurlencode.decode(magnet[1]);
    const title = result.title.split(".").join(" ");
    return [title, fromMagnet(title, "movie", magnet)];
}

function get_movies(resolve, reject) {
    const movies = {};
    console.log(kat.baseURL)
    kat.getMovies().then(
        data => {
            console.log(Object.keys(data));
            async.forEach(data.results, (result) => {

                var s = select(result);
                if (s != undefined) {
                    const info = s[1];
                    let title = s[0].split(" ");
                    if (title.length > 3) {
                        title = [title[0], title[1], title[2]].join(" ");
                    }
                    imdbId(title, function(err, imdb_id) {
                        if (!err) {
                            console.log(title + "  ID : " + imdb_id);
                            movies[imdb_id] = info;
                        } else {
                            console.log(err)
                        }
                    });
                }
            });
            resolve(movies);
        }
    ).catch(
        error => {
            if (error) {
                if (error.message.includes("getaddrinfo EAI_AGAIN")) {
                    console.log("error connecting to the remote server");
                } else {
                    console.log("Something went wrong when getting the movies.")
                    console.log(error);
                }
                reject(error);
                return;
            }
        }
    )
}

// new Promise(get_movies).then((movies) => { console.log(movies) });
module.exports = new Promise(get_movies);