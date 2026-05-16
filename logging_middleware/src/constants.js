// Constants used in the logging middleware
const LOG_API_URI = "http://4.224.186.213/evaluation-service/logs";

const STACKS = ["backend", "frontend"];

const LOG_LEVELS = ["debug", "info", "warn", "error", "fatal"];

const PACKAGES = [
    "cache",
    "controller",
    "cron_job",
    "db",
    "domain",
    "handler",
    "repository",
    "route",
    "service",
    "utils",
    "middleware",
    "config",
];

module.exports = {
    LOG_API_URI,
    STACKS,
    LOG_LEVELS,
    PACKAGES,
};
