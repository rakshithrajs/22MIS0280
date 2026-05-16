const { Log, setAuthToken } = require("logging_middleware");
const config = require("../config/env");

setAuthToken(config.accessToken);

module.exports = { Log };
