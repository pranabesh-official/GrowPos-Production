const mongoose = require('mongoose')

const shopSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    isCompleted:{
        type:Boolean,
        default:false
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'Users'
    },
},{
    timestamps:true
})

const Shop = mongoose.model('Shop',shopSchema)

module.exports = Shop