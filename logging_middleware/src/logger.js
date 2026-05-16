const {
    LOG_API_URI,
    STACK,
    LOG_LEVELS,
    PACKAGES,
    STACKS,
} = require("./constants");

// An in-memory store for auth token
let authToken = null;

// Function to set auth token for logging
const setAuthToken = (token) => {
    if (!token || typeof token !== "string") {
        throw new Error("Invalid token. Token must be a non-empty string.");
    }
    authToken = token;
};

// Validates inputs of the log to maintain integrity of logs and prevent malformed data
const validateInputs = (stack, log_level, package_name) => {
    if (!STACKS.includes(stack)) {
        throw new Error(
            `Invalid stack "${stack}". Allowed: ${STACKS.join(", ")}`,
        );
    }
    if (!LOG_LEVELS.includes(log_level)) {
        throw new Error(
            `Invalid log level "${log_level}". Allowed: ${LOG_LEVELS.join(", ")}`,
        );
    }
    if (!PACKAGES.includes(package_name)) {
        throw new Error(
            `Invalid package "${package_name}". Allowed: ${PACKAGES.join(", ")}`,
        );
    }
};

// Log function
const Log = async (stack, log_level, package_name, message) => {
    try {
        validateInputs(stack, log_level, package_name);
        if (!authToken) {
            console.error(
                "[Logger] Auth token not set. Please set it using setAuthToken(token).",
            );
            return null;
        }

        const payload = {
            stack: stack.toLowerCase(),
            level: log_level.toLowerCase(),
            package: package_name.toLowerCase(),
            message: String(message),
        };

        const response = await fetch(LOG_API_URI, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(payload),
        });
        console.log(response);
        return await response.json();
    } catch (error) {
        console.error(`[Logger] Error: ${error}`);
        return null;
    }
};

module.exports = {
    setAuthToken,
    Log,
};
