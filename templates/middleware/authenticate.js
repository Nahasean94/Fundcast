const jwt = require('jsonwebtoken')
const config = require('../config')
const {Person} = require('../db/schemas')
const mongoose = require('mongoose')


mongoose.connect('mongodb://localhost/redux', {useMongoClient: true, promiseLibrary: global.Promise})

module.exports = async (ctx, next) => {
    const authorizationHeader = ctx.headers['authorization']
    let token
    if (authorizationHeader) {
        token = authorizationHeader.split(' ')[1]
    }
    if (token) {
        jwt.verify(token, config.jwtSecret, async (err, decoded) => {
            "use strict"
            if (err) {
                ctx.status = 401
                ctx.body = {error: 'Failed to authenticate'}
            } else {
                await Person.findById({_id: decoded.id}).exec().then(function (user) {
                    if (!user) {
                        ctx.status = 404
                        ctx.body = {error: 'No such user'}
                    }
                    else {
                        ctx.currentUser = user
                        next()
                    }
                }).catch(function (err) {
                    ctx.status = 500
                    ctx.body = {error: err}
                })
            }
        })
    } else {
        ctx.status = 403
        ctx.body = {error: 'No token provided'}
    }
}