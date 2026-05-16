const { Log } = require("../utils/logger");

// Algorithm to select optimal set of tasks for a depot given its mechanic hours
function selectOptimalTasks(tasks, capacity) {
    const n = tasks.length;

    if (n === 0 || capacity <= 0) {
        return { totalImpact: 0, totalDuration: 0, selectedTasks: [] };
    }

    const dp = Array.from({ length: n + 1 }, () =>
        new Array(capacity + 1).fill(0),
    );

    for (let i = 1; i <= n; i++) {
        const { Duration, Impact } = tasks[i - 1];
        for (let w = 0; w <= capacity; w++) {
            // don't take task i
            dp[i][w] = dp[i - 1][w];
            // Take task i if it fits and improves the impact
            if (Duration <= w) {
                const taken = dp[i - 1][w - Duration] + Impact;
                if (taken > dp[i][w]) dp[i][w] = taken;
            }
        }
    }

    // Backtrack through the DP table
    const selectedTasks = [];
    let remaining = capacity;
    for (let i = n; i > 0 && remaining > 0; i--) {
        if (dp[i][remaining] !== dp[i - 1][remaining]) {
            const task = tasks[i - 1];
            selectedTasks.push(task);
            remaining -= task.Duration;
        }
    }
    selectedTasks.reverse();

    const totalDuration = selectedTasks.reduce((s, t) => s + t.Duration, 0);

    return {
        totalImpact: dp[n][capacity],
        totalDuration,
        selectedTasks,
    };
}

// main function to schedule tasks for a depot
async function scheduleForDepot(depot, tasks) {
    await Log(
        "backend",
        "debug",
        "domain",
        `Running schedule algorithm for depot ${depot.ID} | budget=${depot.MechanicHours} | tasks=${tasks.length}`,
    );

    const result = selectOptimalTasks(tasks, depot.MechanicHours);

    await Log(
        "backend",
        "info",
        "domain",
        `Depot ${depot.ID} schedule computed: impact=${result.totalImpact}, used=${result.totalDuration}/${depot.MechanicHours}h, picked=${result.selectedTasks.length}`,
    );

    return {
        depotId: depot.ID,
        mechanicHoursAvailable: depot.MechanicHours,
        mechanicHoursUsed: result.totalDuration,
        totalImpact: result.totalImpact,
        selectedTaskCount: result.selectedTasks.length,
        selectedTasks: result.selectedTasks,
    };
}

module.exports = { scheduleForDepot };
