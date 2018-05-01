const jwt = require('jsonwebtoken')
const config = require('../config')
const {Person} = require('../../databases/schemas')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')


mongoose.connect('mongodb://localhost/practice', {promiseLibrary: global.Promise})

module.exports = {
    authenticate: async (ctx) => {
        const authorizationHeader = ctx.headers['authorization']
        let token
        if (authorizationHeader) {
            token = authorizationHeader.split(' ')[1]
        }
        if (token) {
            return await jwt.verify(token, config.jwtSecret, async (err, decoded) => {
                if (err) {
                    return {error: 'Failed to authenticate'}
                }
                else {
                    return {
                        id: decoded.id,
                        birthday: decoded.birthday
                    }
                    // return await Person.findById(decoded.id).select('_id username birthday profile_picture first_name last_name email').exec().then(async function (user) {
                    //     if (!user) {
                    //         return {error: 'No such user'}
                    //     }
                    //     else {
                    //         return user
                    //     }
                    // }).catch(function (err) {
                    //     return {error: err}
                    // })
                }
            })
        } else {
            return {error: 'No token provided'}
        }
    },
    login: async (args) => {
        const {email, password} = args
        return await Person.findOne({email: email}).select('email password username birthday').exec().then(function (person) {
            if (person) {
                if (bcrypt.compareSync(password, person.password)) {
                    return {
                        token: jwt.sign({
                            id: person._id,
                            email: person.email,
                            username: person.username,
                            birthday: person.birthday,
                        }, config.jwtSecret)
                    }
                }
                return {errors: {form: 'No user with such credentials exists.'}}
            }
            return {errors: {form: 'No user with such credentials exists.'}}
        }).catch(function (err) {
            return {errors: {form: err}}
        })
    }
}
