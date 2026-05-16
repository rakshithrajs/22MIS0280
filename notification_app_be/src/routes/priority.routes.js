const express = require("express");
const ctrl = require("../controllers/priority.controller");

const router = express.Router();
router.get("/priority-inbox", ctrl.getPriorityInbox);

module.exports = router;
