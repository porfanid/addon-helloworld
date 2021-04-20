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

const { addonBuilder } = require("stremio-addon-sdk");
const magnet = require("magnet-uri");
const fs = require("fs");

const read_file = function() {
    fs.readFile('./movies', 'utf8', function(err, data) {
        console.log("read the data.")
        if (err) {
            Sentry.captureException(err);
            return console.log(err);
        }
        data.split("\n").forEach((movie) => {
            if (movie.match(/[^ ]+/g)) {
                movie = movie.split(";");
                id = movie[0];
                title = movie[1];
                type = movie[2];
                link = movie[3];
                if (link.startsWith("magnet")) {
                    dataset[id] = fromMagnet(title, type, link);
                } else if (link.endsWith("mp4")) {
                    dataset[id] = { name: title, type: type, url: link }
                } else if (link.indexOf("youtube") > -1) {
                    yt_id = link.split("v=")[1].split("&")[0];
                    dataset[id] = { name: title, type: type, ytId: yt_id }
                }
            }
        });
    });
}

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
read_file();
fs.watchFile("./movies", read_file);



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