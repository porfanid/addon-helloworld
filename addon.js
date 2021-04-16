const { addonBuilder } = require("stremio-addon-sdk");
const kickass = require("./kickass");

const manifest = {
    "id": "org.stremio.helloworld",
    "version": "1.0.0",

    "name": "Hello World Addon",
    "description": "Sample addon providing a few public domain movies",
    "logo": "https://www.stremio.com/website/stremio-logo-small.png",

    // set what type of resources we will return
    "resources": [
        "catalog",
        "stream"
    ],

    "types": ["movie"], // your add-on will be preferred for those content types

    // set catalogs, we'll be making 2 catalogs in this case, 1 for movies and 1 for series
    "catalogs": [{
        type: 'movie',
        id: 'zircon-movies'
    }],

    // prefix of item IDs (ie: "tt0032138")
    "idPrefixes": ["tt"]

};

const METAHUB_URL = "https://images.metahub.space"

const generateMetaPreview = function(value, key) {
    // To provide basic meta for our movies for the catalog
    // we'll fetch the poster from Stremio's MetaHub
    // see https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/meta.md#meta-preview-object
    const imdbId = key.split(":")[0]
    console.log(METAHUB_URL + "/poster/medium/" + imdbId + "/img");
    return {
        id: imdbId,
        type: value.type,
        name: value.name,
        poster: METAHUB_URL + "/poster/medium/" + imdbId + "/img",
    }
}



//----------------------------------------------------------------




//let dataset = {};
//kickass.then((data) => { dataset = data })

const builder = new addonBuilder(manifest);

// Streams handler
builder.defineStreamHandler(function(args) {
    console.log("starting");
    return new Promise(function(resolve, reject) {
        kickass.then((dataset) => {
            if (dataset[args.id]) {
                console.log("success");
                resolve({ streams: [dataset[args.id]] })
            } else {
                console.log("something went wrong");
                resolve({ streams: [] });
            }
        })
    })
});


builder.defineCatalogHandler(function(args, cb) {
    return new Promise(function(resolve, reject) {
        kickass.then((dataset) => {
            const metas = Object.entries(dataset)
                .filter(([_, value]) => value.type === args.type)
                .map(([key, value]) => generateMetaPreview(value, key));


            resolve({ metas: metas })
        }).catch(reject)

    });
})

module.exports = builder.getInterface()