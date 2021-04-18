const { addonBuilder } = require("stremio-addon-sdk");
const magnet = require("magnet-uri");
const fs = require("fs");
const file="./movies";

const manifest = {
    "id": "org.zircon.stremio_addon",
    "version": "1.0.0",

    "name": "All movies provided by Zircon",
    "description": "Sample addon providing a lot of movies.",

    // set what type of resources we will return
    "resources": [
        "catalog",
        "stream"
    ],

    "types": ["movie", "series"], // your add-on will be preferred for those content types

    // set catalogs, we'll be making 2 catalogs in this case, 1 for movies and 1 for series
    "catalogs": [{
            type: 'movie',
            id: 'helloworldmovies'
        },
        {
            type: 'series',
            id: 'helloworldseries'
        }
    ],

    // prefix of item IDs (ie: "tt0032138")
    "idPrefixes": ["tt"]

};

const dataset = {};
// "tt0063350": fromMagnet("Night of the Living Dead", "movie", "magnet:?xt=urn:btih:A7CFBB7840A8B67FD735AC73A373302D14A7CDC9&dn=night+of+the+living+dead+1968+remastered+bdrip+1080p+ita+eng+x265+nahom&tr=udp%3A%2F%2Ftracker.publicbt.com%2Fannounce&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce"),
fs.readFile('./movies', 'utf8', function(err, data) {
    if (err) {
        return console.log(err);
    }
    data.split("\n").forEach((movie) => {
        if (movie.match(/[^ ]+/g)) {
            movie = movie.split(";");
            id = movie[0];
            title = movie[1];
            type = movie[2];
            magnet_link = movie[3];
            dataset[id] = fromMagnet(title, type, magnet_link);
        }
    });
});


fs.watchFile("./movies", () => {
    console.log("The file has been updated");
    fs.readFile('./movies', 'utf8', function(err, data) {
        if (err) {
            return console.log(err);
        }
        data.split("\n").forEach((movie) => {
            if (movie.match(/[^ ]+/g)) {
                console.log(movie);
                movie = movie.split(";");
                id = movie[0];
                title = movie[1];
                type = movie[2];
                magnet_link = movie[3];
                dataset[id] = fromMagnet(title, type, magnet_link);
            }
        });
    });
});



// utility function to add from magnet
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
        title: tags[0], // show quality in the UI
    }
}

const builder = new addonBuilder(manifest);

// Streams handler
builder.defineStreamHandler(function(args) {
    if (dataset[args.id]) {
        return Promise.resolve({ streams: [dataset[args.id]] });
    } else {
        return Promise.resolve({ streams: [] });
    }
})

const METAHUB_URL = "https://images.metahub.space"

const generateMetaPreview = function(value, key) {
    // To provide basic meta for our movies for the catalog
    // we'll fetch the poster from Stremio's MetaHub
    // see https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/meta.md#meta-preview-object
    const imdbId = key.split(":")[0]
    return {
        id: imdbId,
        type: value.type,
        name: value.name,
        poster: METAHUB_URL + "/poster/medium/" + imdbId + "/img",
    }
}

builder.defineCatalogHandler(function(args, cb) {
    // filter the dataset object and only take the requested type
    const metas = Object.entries(dataset)
        .filter(([_, value]) => value.type === args.type)
        .map(([key, value]) => generateMetaPreview(value, key))

    return Promise.resolve({ metas: metas })
})

module.exports = builder.getInterface()