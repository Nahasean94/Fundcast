/***
 *
 * @type {module.Application|*}
 * This module contains all the code needed to setup a server. The server will run on port
 8080.
 */

//Import all the neede modules
const Koa = require('koa')//module for starting the server
const Router = require('koa-router')//module to handle the routes
const koaBody = require('koa-bodyparser')//module to handle body data of the post request
const serve = require('koa-static-server')//module to serve files like images and podcasts
const cors = require('koa2-cors')//module to allow cross origin resource sharing
const {graphqlKoa, graphiqlKoa} = require('apollo-server-koa')//modules to handle grapqhl requests
const schema = require('./api/graphql_schema')//import our graphql schemas
const {apolloUploadKoa} = require('apollo-upload-server')//handle all uploads to the server

//Initialize the app and router objects
const app = new Koa()
const router = new Router()
//expose the public folder which contains the uploads
app.use(serve({rootDir: 'public', path: '/public'}))

//listen and handle post requests
// koaBody is needed just for POST.
router.post('/graphql', koaBody(), apolloUploadKoa(),
    (context, next) => graphqlKoa({
        schema,
        context,
    })(context, next),
)
//listen and handle the get requests
router.get('/graphql', graphqlKoa({schema: schema, context: app.context}))
//setup endpoint for the GUI to allow testing of the APIs without a concrete front end.
router.get('/graphiql', graphiqlKoa({endpointURL: '/graphql'}))


//Allow cross origin resource sharing
app.use(cors())
//expose the above mention routes
app.use(router.routes())
//allow methods get and post to be accepted
app.use(router.allowedMethods())
//Start the server and listen on port 8080 and log on the console once server starts.
app.listen(8080, () => console.log("Server started on port 8080"))
