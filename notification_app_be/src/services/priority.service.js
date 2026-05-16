const MinHeap = require("../utils/MinHeap");
const { Log } = require("../utils/logger");

// Higher type weight = higher priority
const TYPE_WEIGHTS = { Placement: 3, Result: 2, Event: 1 };

function calculateScore(notification) {
    const typeWeight = TYPE_WEIGHTS[notification.Type] || 0;
    const timestampMs = new Date(notification.Timestamp).getTime() || 0;
    return typeWeight * 1e13 + timestampMs;
}

function findTopN(notifications, n) {
    if (!Array.isArray(notifications) || n <= 0) return [];

    const heap = new MinHeap((a, b) => a.score - b.score);

    for (const item of notifications) {
        const scored = { ...item, score: calculateScore(item) };

        if (heap.size() < n) {
            heap.push(scored);
        } else if (scored.score > heap.peek().score) {
            heap.pop();
            heap.push(scored);
        }
    }

    // Drain the heap and reverse so the highest-priority item comes first
    const out = [];
    while (heap.size() > 0) out.push(heap.pop());
    return out.reverse();
}

async function getPriorityInbox(notifications, n) {
    await Log(
        "backend",
        "debug",
        "domain",
        `Computing top ${n} from ${notifications.length} notifications`,
    );
    const top = findTopN(notifications, n);
    await Log(
        "backend",
        "info",
        "domain",
        `Priority inbox computed: returned ${top.length} items`,
    );

    return top.map((item) => ({
        id: item.ID,
        type: item.Type,
        message: item.Message,
        timestamp: item.Timestamp,
        priorityScore: item.score,
    }));
}

module.exports = { getPriorityInbox, findTopN, calculateScore };
