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
    const dataset = {};
    const data = fs.readFileSync("./movies", "utf8", Sentry.captureException);
    data.split("\n").forEach((movie) => {
        if (movie.match(/[^ ]+/g)) {
            movie = movie.split(";");
            id = movie[0];
            if (!(id in dataset)) {
                dataset[id] = [];
            }
            title = movie[1];
            type = movie[2];
            link = movie[3];
            if (link == undefined) {
                console.log(movie);
                return;
            }

            if (link.startsWith("magnet")) {
                // console.log(link);
                dataset[id].push(fromMagnet(title, type, link));
            } else if (link.endsWith("mp4")) {
                dataset[id].push({ name: title, type: type, url: link });
            } else if (link.indexOf("youtube") > -1) {
                yt_id = link.split("v=")[1].split("&")[0];
                dataset[id].push({ name: title, type: type, ytId: yt_id });
            }
        }
    });
    return dataset;
}

const manifest = {
    "id": "community.stremio_addon",
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
        id: 'movie'
    }]

};
/*
const dataset = {
    // fileIdx is the index of the file within the torrent ; if not passed, the largest file will be selected
    "tt0032138": [{ name: "The Wizard of Oz", type: "movie", infoHash: "24c8802e2624e17d46cd555f364debd949f2c81e", fileIdx: 0 }],
    "tt0017136": [{ name: "Metropolis", type: "movie", infoHash: "dca926c0328bb54d209d82dc8a2f391617b47d7a", fileIdx: 1 }],

    // night of the living dead, example from magnet
    "tt0063350": [fromMagnet("Night of the Living Dead", "movie", "magnet:?xt=urn:btih:A7CFBB7840A8B67FD735AC73A373302D14A7CDC9&dn=night+of+the+living+dead+1968+remastered+bdrip+1080p+ita+eng+x265+nahom&tr=udp%3A%2F%2Ftracker.publicbt.com%2Fannounce&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce")],
    "tt0051744": [{ name: "House on Haunted Hill", type: "movie", infoHash: "9f86563ce2ed86bbfedd5d3e9f4e55aedd660960" }],

    "tt1254207": [{ name: "Big Buck Bunny", type: "movie", url: "http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4" }], // HTTP stream
    "tt0031051": [{ name: "The Arizona Kid", type: "movie", ytId: "m3BKVSpP80s" }], // YouTube stream

    "tt0137523": [{ name: "Fight Club", type: "movie", externalUrl: "https://www.netflix.com/watch/26004747" }], // redirects to Netflix

    "tt1748166:1:1": [{ name: "Pioneer One", type: "series", infoHash: "07a9de9750158471c3302e4e95edb1107f980fa6" }], // torrent for season 1, episode 1
};
*/
const dataset = read_file();
// console.log(dataset);

// utility function to add from magnet
function fromMagnet(name, type, uri) {
    const parsed = magnet.decode(uri);
    const infoHash = parsed.infoHash.toLowerCase();
    const tags = [];
    if (uri.match(/720p/i)) tags.push("720p");
    if (uri.match(/1080p/i)) tags.push("1080p");
    return {
        name: "KickAss Torrents\n" + tags[0],
        type: type,
        infoHash: infoHash,
        sources: (parsed.announce || []).map(function(x) { return "tracker:" + x }).concat(["dht:" + infoHash]),
        tag: tags,
        title: name + "\n" + tags.join(" "), // show quality in the UI
    }
}

const builder = new addonBuilder(manifest);

// Streams handler
builder.defineStreamHandler(function(args) {
    if (dataset[args.id]) {
        return Promise.resolve({ streams: dataset[args.id] });
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

//here lies the bug.
builder.defineCatalogHandler(function(args, cb) {
    // filter the dataset object and only take the requested type
    const metas = Object.entries(dataset)
        .filter(([_, value]) => value[0].type === args.type)
        .map(([key, value]) => generateMetaPreview(value[0], key))

    return Promise.resolve({ metas: metas })
})

module.exports = builder.getInterface()