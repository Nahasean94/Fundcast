const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PersonSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique:true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
    },
    timestamp:{
        type:Date,
        default:Date.now(),
    }
})
const Person=mongoose.model('Person',PersonSchema)
module.exports={Person}