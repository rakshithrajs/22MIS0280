const { Log } = require("../utils/logger");

const errorHandler = async (err, req, res, next) => {
    await Log(
        "backend",
        "error",
        "middleware",
        `Unhandled error on ${req.method} ${req.originalUrl}: ${err}`,
    );
    res.status(500).json({
        error: "Internal server error",
        detail: err.message,
    });
};

module.exports = { errorHandler };
