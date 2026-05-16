const { Log, setAuthToken } = require("logging_middleware");
const { accessToken } = require("../config/env");

setAuthToken(accessToken);

module.exports = {
    Log,
};
