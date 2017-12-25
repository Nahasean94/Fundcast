"use strict"
const Validator = require('validator')
const {isEmpty} = require('lodash')
const bcrypt = require('bcrypt')
const {Person} = require('../db/schemas')
const mongoose = require('mongoose')
const jwt=require('jsonwebtoken')
const config=require('../config')

mongoose.connect('mongodb://localhost/redux', {useMongoClient: true, promiseLibrary: global.Promise})


function validateInput(data) {
    let errors = {}
    if (Validator.isEmpty(data.username)) {
        errors.username = 'This field is required'
    }
    if (Validator.isEmpty(data.email)) {
        errors.email = 'This field is required'
    }
    if (!Validator.isEmail(data.email)) {
        errors.email = 'This field must be an email'
    }
    if (Validator.isEmpty(data.password)) {
        errors.password = 'This field is required'
    }
    if (Validator.isEmpty(data.passwordConfirmation)) {
        errors.passwordConfirmation = 'This field is required'
    }
    if (!Validator.equals(data.password, data.passwordConfirmation)) {
        errors.passwordConfirmation = 'Passwords must match'
    }
    if (Validator.isEmpty(data.username)) {
        errors.username = 'This field is required'
    }
    return {
        errors,
        isValid: isEmpty(errors)
    }
}

async function higherValidation(data, otherValidations) {
    let {errors} = otherValidations(data)
    return await Person.findOne({email: data.email}).exec().then(function (user) {
        if (user) {
            errors.email = 'There is a user with such email'
        }
        return {
            errors, isValid: isEmpty(errors)
        }
    })
}

module.exports = {
    registerUser: async ctx => {
        await higherValidation(ctx.request.body, validateInput).then(async function ({errors, isValid}) {
            if (isValid) {
                const {username, email, password} = ctx.request.body
                const password_digest = bcrypt.hashSync(password, 10)
                await new Person({
                    username: username,
                    email: email,
                    password: password_digest
                }).save().then(function (success) {
                    ctx.body = {success: true}
                }).catch(function (err) {
                    ctx.status = 500
                    ctx.body = err
                })
            } else {
                ctx.status = 400
                ctx.body = errors
            }
        }).catch(function () {

        })
    },
    checkUserExists: async ctx => {
        return await Person.findOne({email: ctx.params.email}).exec().then(function (user) {
            console.log("usr is ", user)
            ctx.body = user
        })
    },
    userLogin: async ctx => {
        const {email, password} = ctx.request.body
        const password_digest = bcrypt.hashSync(password, 10)
        await Person.findOne({email: email}).exec().then(function (person) {
            if (person) {
                if (bcrypt.compareSync(password, person.password)) {
                    ctx.body = {token:jwt.sign({
                        id: person._id,
                        email: person.email,
                        username: person.username
                    }, config.jwtSecret)}
                }
                else {
                    ctx.status = 401
                    ctx.body = {errors: {form: 'No user with such credentials exists.'}}
                }
            } else {
                ctx.status = 401
                ctx.body = {errors: {form: 'No user with such credentials exists.'}}
            }
        }).catch(function (err) {
            ctx.status = 400
            ctx.body = err
        })
    }
}