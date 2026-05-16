require("dotenv").config();

const config = {
    port: parseInt(process.env.PORT, 10) || 5000,
    accessToken: process.env.ACCESS_TOKEN,
    depotsAPI: process.env.DEPOTS_API,
    vehiclesAPI: process.env.VEHICLES_API,
};

const required = ["accessToken", "depotsAPI", "vehiclesAPI"];
for (const key of required) {
    if (!config[key]) {
        console.error(
            `[config] Missing required env var for "${key}". See .env.example`,
        );
        process.exit(1);
    }
}
