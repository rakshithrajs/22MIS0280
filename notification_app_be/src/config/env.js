require("dotenv").config();

const config = {
    port: parseInt(process.env.PORT, 10) || 3002,
    accessToken: process.env.ACCESS_TOKEN,
    notificationsApi: process.env.NOTIFICATIONS_API,
};

for (const key of ["accessToken", "notificationsApi"]) {
    if (!config[key]) {
        console.error(
            `[config] Missing required env var "${key}". See .env.example`,
        );
        process.exit(1);
    }
}

module.exports = config;
