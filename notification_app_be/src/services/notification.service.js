const config = require("../config/env");
const { Log } = require("../utils/logger");

async function fetchNotifications() {
    await Log(
        "backend",
        "info",
        "service",
        "Fetching notifications from external API",
    );

    const response = await fetch(config.notificationsApi, {
        method: "GET",
        headers: { Authorization: `Bearer ${config.accessToken}` },
    });

    if (!response.ok) {
        await Log(
            "backend",
            "error",
            "service",
            `Notifications API failed with status ${response.status}`,
        );
        throw new Error(`Upstream API returned ${response.status}`);
    }

    const data = await response.json();
    return data.notifications || [];
}

module.exports = { fetchNotifications };
