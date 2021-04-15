const kat = require('kickass-torrent-api');
const base64url = require("base64url")

var decode = function(input) {
    // Replace non-url compatible chars with base64 standard chars
    input = input
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    // Pad out with standard base64 required padding characters
    var pad = input.length % 4;
    if (pad) {
        if (pad === 1) {
            throw new Error('InvalidLengthError: Input base64url string is the wrong length to determine padding');
        }
        input += new Array(5 - pad).join('=');
    }

    return input;
}



kat.getMovies().then(
    data => {
        data.results.forEach(function(result) {
            const magnet = result.page_link.split("url=");
            if (magnet[0] !== "https://mylink.cx/?")
                return;
            console.log(base64url.decode(decode(magnet[1]), 'base64'));
        })
    }
).catch(
    console.log("Something went wrong when getting the movies.")
)