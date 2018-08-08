/***
 *
 * Code in this file either logs the user into the system or authenticates the communication  token to determine access level of the user.
 */

//Import various modules needed
const jwt = require('jsonwebtoken')
const config = require('../config')
const {Person} = require('../../databases/schemas')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

//Connect to the MongoDB fundcast database with mongoose module
mongoose.connect('mongodb://localhost/fundcast', {promiseLibrary: global.Promise})

//export modules authenticate and login to be used by the request handler.
module.exports = {
    /**
     *      * @param ctx
     * @return {Promise<*>}
     * This modules breaks down the headers of the request and obtains the authorization token. It then decodes the token to verify the authenticity of the request.
     */
    authenticate: async (ctx) => {
        const authorizationHeader = ctx.headers['authorization']//ctx is the context of the request passed to this function.
        let token
        if (authorizationHeader) {
            token = authorizationHeader.split(' ')[1]
        }
        if (token) {
//Decodes the token using a secret key and return the response depending on whether the request is authenticated, failed to authenticate or no token provided.
            return await jwt.verify(token, config.jwtSecret, async (err, decoded) => {
                if (err) {
                    return {error: 'Failed to authenticate'}
                }
                else {
                    return {
                        id: decoded.id,
                    }
                }
            })
        } else {
            return {error: 'No token provided'}
        }
    },
    /**
     * * @param args
     * @return {Promise<any | never | {ok: boolean, token: null, error: any}>}
     *
     * This module receives login credentials, and checks whether the user exists and then verifies the password.
     * Responses are sent depending on whether the login credentials match any in the database.
     */
    login: async (args) => {
        const {email, password} = args//breaks down the arguments
        //Goes into the Person table and finds a user with the given email, and selects their email, password, username, role ethereum_address.
        return await Person.findOne({email: email}).select('email password username role ethereum_address').exec().then(function (person) {
            if (person) {
                //Compares the hash of the stored password and one passed in the request. If they match, return a token with email, id, username, role and ethereum_address encoded into it for use the front end.
                if (bcrypt.compareSync(password, person.password)) {
                    return {
                        ok: true,
                        token: jwt.sign({
                            id: person._id,
                            email: person.email,
                            username: person.username,
                            role: person.role,
                            ethereum_address:person.ethereum_address
                        }, config.jwtSecret),
                        error: null
                    }
                }
                //If passwords don't match, return a login failure message below
                return {
                    ok: false,
                    token: null,
                    error: 'No user with such credentials exists. Please check your email and password and try again.'
                }
            }
            //If not user with the given email matches any records in the database, return a login error with the message below.
            return {
                ok: false,
                token: null,
                error: 'No user with such credentials exists. Please check your email and password and try again.'
            }
        }).catch(function (err) {
            return {
                ok: false,
                token: null,
                error: err
            }
        })
    }
}
