const { serveHTTP } = require("stremio-addon-sdk");

const addonInterface = require("./addon");
serveHTTP(addonInterface, { port: 8080 });