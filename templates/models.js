'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const UserSchema = new Schema({
    username: {
        type: String,
        unique: [true, 'Username must be unique']
    },
    email: {
        type: String,
        unique: [true, 'Email must be unique']
    },
    password: {
        type: String,
    }
})
const TeamSchema = new Schema({
    name: {
        type: String,
        unique: [true, 'Team must be unique']
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:'User'
    }
})
const ChannelSchema = new Schema({
    name: {
        type: String,
    },
    team:{
        type:Schema.Types.ObjectId,
        ref:'Team'
    },
    isPublic:Boolean
})
const MessageSchema = new Schema({
    text: {
        type: String,
    },
    user:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    channel:{
        type:Schema.Types.ObjectId,
        ref:'Channel'
    },

})
const MemberSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    team:{
        type:Schema.Types.ObjectId,
        ref:'Team'
    },

})

const User=mongoose.model('User',UserSchema)
const Team=mongoose.model('Team',TeamSchema)
const Channel=mongoose.model('Channel',ChannelSchema)
const Message=mongoose.model('Message',MessageSchema)
const Member=mongoose.model('Member',MemberSchema)

module.exports={User,Team,Channel,Message,Member}