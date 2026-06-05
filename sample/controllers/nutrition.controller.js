import { items } from "./items.controller.js";

export const getNutrition = (req, res) => {
    const fromDate = new Date(req.params.fromDate);
    const toDate = new Date(req.params.toDate);
    const FileteredItems = items.filter((i) => fromDate < i.date < toDate)
    let length = FileteredItems.length
    let insight = {
            "quantity": 0,
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "weight": 0
    }
    const i = items.reduce((insight, i) => {
        insight = {
            "quantity": insight.quantity + i.quantity,
            "calories": insight.quantity + i.calories,
            "protein": insight.quantity + i.protein,
            "carbs": insight.quantity + i.carbs,
            "fat": insight.quantity + i.fat,
            "weight": insight.weight + i.weight
        }
    })
    console.log(i)
    return res.json();
}