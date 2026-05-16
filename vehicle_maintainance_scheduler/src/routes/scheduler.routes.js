const express = require("express");
const {
    listDepots,
    listVehicles,
    scheduleAllDepots,
    scheduleOneDepot,
} = require("../controllers/scheduler.controller");

const router = express.Router();

router.get("/depots", listDepots);
router.get("/vehicles", listVehicles);
router.get("/schedule", scheduleAllDepots);
router.get("/schedule/:depotId", scheduleOneDepot);

module.exports = router;
