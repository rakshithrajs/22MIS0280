const express = require("express");
const { port } = require("./config/env");
const schedulerRoutes = require("./routes/scheduler.routes");
const { errorHandler } = require("./middleware/error.middleware");
const { Log } = require("./utils/logger");

const app = express();
app.use(express.json());

// Request logging middleware
app.use(async (req, res, next) => {
    await Log(
        "backend",
        "info",
        "route",
        `Incoming ${req.method} ${req.originalUrl}`,
    );
    next();
});

app.use("/api", schedulerRoutes);
app.use(errorHandler);

app.listen(port, () => {
    console.log(`service listening on port ${port}`);
    Log("backend", "info", "config", `service started on port ${port}`);
});
