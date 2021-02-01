const express = require('express')
const Shop = require('../db/models/shop');
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/Shops', auth, async (req, res) => {
    const shop = new Shop({ ...req.body, owner: req.user._id })
    try {
        await Shop.save()
        res.status(201).send(shop)
    } catch (e) {
        res.status(500).send(e.message)
    }
})
//pagination limit=10 skip=10
//sort
router.get('/Shops', auth, async (req, res) => {
    const match = {}
    const sort = {}
    if (req.query.isCompleted) {
        match.isCompleted = req.query.isCompleted === 'true'
    }
    if (req.query.sortBy) {
        const str = req.query.sortBy.split(':')
        sort[str[0]] = str[1] === 'desc' ? -1 : 1
    }
    try {
        // const Shops = await Shops.find({owner:req.user._id})
        await req.user.populate({
            path: 'Shop',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.status(200).send(req.user.Shop)
    } catch (e) {
        res.status(400).send(e.message)
    }
})

router.get('/Shops/:id', auth, async (req, res) => {
    try {
        const shop = await Shop.findByOne({ _id: req.params.id, owner: req.user._id })
        if (!shop)
            return res.status(404).send()
        res.status(200).send(shop)
    } catch (e) {
        res.status(400).send()
    }
})

router.patch('/Shops/:id', auth, async (req, res) => {
    const allowedUpdates = ['name', 'isCompleted']
    const keys = Object.keys(req.body);
    const isUpdationValid = keys.every(key => allowedUpdates.includes(key))
    if (!isUpdationValid)
        res.status(400).send()
    try {
        const shop = await Shop.findByOne({ _id: req.params.id, owner: req.user._id })
        if (!Shop)
            return res.status(404).send()
        res.status(200).send(shop)
    } catch (e) {
        res.status(400).send()
    }
})

router.delete('/Shops/:id', auth, async (req, res) => {
    try {
        const shop = await Shop.findByOne({ _id: req.params.id, owner: req.user._id })
        if (!Shop)
            return res.status(404).send()
        res.status(200).send(shop)

    } catch (e) {
        res.status(400).send()
    }
})
module.exports = router
