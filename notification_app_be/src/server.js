const express = require("express");
const config = require("./config/env");
const priorityRoutes = require("./routes/priority.routes");
const { Log } = require("./utils/logger");

const app = express();
app.use(express.json());

app.use(async (req, res, next) => {
    await Log(
        "backend",
        "info",
        "route",
        `Incoming ${req.method} ${req.originalUrl}`,
    );
    next();
});

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api", priorityRoutes);

app.use(async (err, req, res, next) => {
    await Log(
        "backend",
        "error",
        "middleware",
        `Unhandled error on ${req.originalUrl}: ${err.message}`,
    );
    res.status(500).json({
        error: "Internal server error",
        detail: err.message,
    });
});

app.listen(config.port, () => {
    console.log(`Notification service listening on port ${config.port}`);
    Log(
        "backend",
        "info",
        "config",
        `Notification service started on port ${config.port}`,
    );
});
