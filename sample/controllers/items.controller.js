export let items = []

export const getItems = (req, res) => {
    try {
        return res.status(200).json({message:"fetched items", data:{items}})
    } catch (error) {
        console.error(error)
        res.json({success: false})
    }
}

export const addItem = (req, res) => {
    try {
        const item = req.body;
        const length = items.length
        items.push({id: length+1, ...item, date: new Date()})
        return res.status(201).json({message:"item added successfully", data:{item}})
    } catch (error) {
        console.log(error)
        res.status(400).json({success: false})
    }
}

export const updateItem = (req, res) => {
    try {
        const itemId = req.params.itemid;
        const itemFirst = items.slice(0, itemId-1);
        const itemsLast = items.slice(itemId)
        const item = req.body;
        items = itemFirst.concat(item, itemsLast)
        return res.status(200).json(item)
    } catch (error) {
        console.error(error)
        res.status(400).json({success: false})
    }
}

export const deleteItem = (req, res) => {
    try {
        const itemId = parseInt(req.params.itemid)
        const itemFirst = items.slice(0, itemId-1);
        const itemsLast = items.slice(itemId)
        items = itemFirst.concat(itemsLast)
        return res.status(204).json()
    } catch (error) {
        console.error(error)
        res.status(400).json({success: false})
    }
}