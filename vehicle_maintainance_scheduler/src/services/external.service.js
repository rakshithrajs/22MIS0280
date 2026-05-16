const { accessToken, depotsAPI, vehiclesAPI } = require("../config/env");
const { Log } = require("../utils/logger");

// request wrapper to fetch data from API with authentication
async function fetchProtected(url) {
    const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        await Log(
            "backend",
            "error",
            "service",
            `API GET ${url} failed with status ${response.status}`,
        );
    }

    return response.json();
}

// functions to fetch depots
async function getDepots() {
    await Log(
        "backend",
        "info",
        "service",
        "Fetching depots from external API",
    );
    const data = await fetchProtected(depotsAPI);
    await Log(
        "backend",
        "info",
        "service",
        `Received ${data.depots ? data.depots.length : 0} depots from API`,
    );
    return data.depots || [];
}

// functions to fetch vehicles
async function getVehicles() {
    await Log(
        "backend",
        "info",
        "service",
        "Fetching vehicles from external API",
    );
    const data = await fetchProtected(vehiclesAPI);
    await Log(
        "backend",
        "info",
        "service",
        `Received ${data.vehicles ? data.vehicles.length : 0} vehicles from API`,
    );
    return data.vehicles || [];
}

module.exports = { getDepots, getVehicles };
