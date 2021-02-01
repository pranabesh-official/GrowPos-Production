const Users = require('../db/models/users');

const getUser = async (req, res, next) => {
    const id =req.params.id
    console.log(id)
    let users = null
    try {
        users = await Users.findOne({_id:id})
        if (!users) {
            return res.status(404).json({ message: 'Cant find users' })
        }
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
    res.subscriber = users
    next()

}



module.exports = getUser