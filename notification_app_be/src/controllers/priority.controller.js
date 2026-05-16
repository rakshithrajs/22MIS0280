const notificationService = require("../services/notification.service");
const priorityService = require("../services/priority.service");
const { Log } = require("../utils/logger");

async function getPriorityInbox(req, res, next) {
    try {
        const n = parseInt(req.query.n, 10) || 10;

        if (n < 1 || n > 100) {
            await Log(
                "backend",
                "warn",
                "handler",
                `Invalid n value: ${req.query.n}`,
            );
            return res
                .status(400)
                .json({ error: "n must be between 1 and 100" });
        }

        const notifications = await notificationService.fetchNotifications();
        const topN = await priorityService.getPriorityInbox(notifications, n);

        res.status(200).json({
            totalAvailable: notifications.length,
            returned: topN.length,
            inbox: topN,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { getPriorityInbox };
