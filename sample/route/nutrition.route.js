import { Router } from "express";
import { getNutrition } from "../controllers/nutrition.controller.js";


export const nutritionRoute = Router()

nutritionRoute.get("/", getNutrition)