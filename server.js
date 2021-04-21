const { serveHTTP } = require("stremio-addon-sdk");
const PORT = process.env.PORT || 3000;
const addonInterface = require("./addon");
serveHTTP(addonInterface, { port: PORT });