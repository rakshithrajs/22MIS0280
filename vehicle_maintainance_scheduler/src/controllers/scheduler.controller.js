const { getDepots, getVehicles } = require("../services/externalApi.service");
const { scheduleForDepot } = require("../services/core.service");
const { Log } = require("../utils/logger");

const listDepots = async (req, res, next) => {
    try {
        const depots = await getDepots();
        res.status(200).json({ count: depots.length, depots });
    } catch (err) {
        next(err);
    }
};

const listVehicles = async (req, res, next) => {
    try {
        const vehicles = await getVehicles();
        res.status(200).json({ count: vehicles.length, vehicles });
    } catch (err) {
        next(err);
    }
};

const scheduleOneDepot = async (req, res, next) => {
    try {
        const depotId = parseInt(req.params.depotId, 10);
        if (Number.isNaN(depotId)) {
            await Log(
                "backend",
                "warn",
                "handler",
                `Invalid depotId path param: ${req.params.depotId}`,
            );
            return res
                .status(400)
                .json({ error: "depotId must be an integer" });
        }

        const [depots, tasks] = await Promise.all([
            getDepots(),
            getVehicles(),
        ]);

        const depot = depots.find((d) => d.ID === depotId);
        if (!depot) {
            await Log(
                "backend",
                "warn",
                "handler",
                `Depot ${depotId} not found`,
            );
            return res
                .status(404)
                .json({ error: `Depot ${depotId} not found` });
        }

        const result = await scheduleForDepot(depot, tasks);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const scheduleAllDepots = async (req, res, next) => {
    try {
        const [depots, tasks] = await Promise.all([
            getDepots(),
            getVehicles(),
        ]);

        const schedules = await Promise.all(
            depots.map((d) => scheduleForDepot(d, tasks)),
        );
        const overallImpact = schedules.reduce((s, d) => s + d.totalImpact, 0);

        res.status(200).json({
            depotCount: depots.length,
            overallImpact,
            schedules,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    listDepots,
    listVehicles,
    scheduleOneDepot,
    scheduleAllDepots,
};
