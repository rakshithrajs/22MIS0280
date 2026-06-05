import express, { urlencoded } from "express";
import { itemRoutes } from "./route/items.route.js";
import { config } from "dotenv"
import { nutritionRoute } from "./route/nutrition.route.js";

config()
const PORT = process.env.PORT || 3000;

const app = express()

app.use(express.json())
app.use(urlencoded({ exteded: true }))

app.use("/api/items", itemRoutes);
app.use("/api/nutrition", nutritionRoute)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})