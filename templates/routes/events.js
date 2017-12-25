"use strict"
const {Person} = require('../db/schemas')
const mongoose = require('mongoose')


mongoose.connect('mongodb://localhost/redux', {useMongoClient: true, promiseLibrary: global.Promise})

module.exports = {
    createEvent: async ctx => {
        console.log(ctx.request.body)
        // ctx.status=201
        ctx.body={user:ctx.currentUser}
        // console.log(ctx)
    }
}