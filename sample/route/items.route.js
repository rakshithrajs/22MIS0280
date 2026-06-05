import { Router } from "express";
import { getItems, addItem, updateItem, deleteItem } from "../controllers/items.controller.js"

export const itemRoutes = Router();

itemRoutes.get("/", getItems)
itemRoutes.post("/", addItem)
itemRoutes.put("/:itemid", updateItem)
itemRoutes.delete("/:itemid", deleteItem)

