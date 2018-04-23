// const express =require( 'express')
// const bodyParser =require( 'body-parser')
// const { graphqlExpress,graphiqlExpress } =require( 'apollo-server-express')
// const typeDefs =require( './schema')
// const resolvers =require( './resolvers')
// const {makeExecutableSchema} =require( 'graphql-tools')
// const mongoose = require('mongoose')
// const {User,Team,Channel,Message,Member}=require('./models')
// //Connect to Mongodb
// mongoose.connect('mongodb://localhost/slack', {promiseLibrary: global.Promise})
// // const myGraphQLSchema = // ... define or const your schema here!
// const schema=makeExecutableSchema({
//     typeDefs,
//     resolvers
// })
// const graphqlEndpoint='/graphql'
// const app = express()
//
// // bodyParser is needed just for POST.
// app.use(graphqlEndpoint, bodyParser.json(), graphqlExpress({ schema ,context:{User,Team,Channel,Message,Member}}))
// app.use('/graphiql', graphiqlExpress({endpointURL:graphqlEndpoint }))
//
// app.listen(8080,()=>console.log("Server running on port 8080"))

import Koa from 'koa'
const koaRouter = require('koa-router')
const koaBody = require('koa-bodyparser')
const {graphqlKoa,graphiqlKoa } = require('apollo-server-koa')
const {makeExecutableSchema} = require('graphql-tools')
const typeDefs = require('./schema')
const resolvers = require('./resolvers')
const mongoose = require('mongoose')
const {User, Team, Channel, Message, Member} = require('./models')
const cors = require('koa2-cors')

mongoose.connect('mongodb://localhost/slack', {promiseLibrary: global.Promise})

const app = new Koa()
const router = new koaRouter()

// koaBody is needed just for POST.
app.use(koaBody())
const schema = makeExecutableSchema({
    typeDefs,
    resolvers
})
router.post('/graphql', graphqlKoa({schema, context: {User, Team, Channel, Message, Member}}))
router.get('/graphql', graphqlKoa({schema, context: {User, Team, Channel, Message, Member}}))
router.get('/graphiql', graphiqlKoa({endpointURL: '/graphql',}))

app.use(cors())
app.use(router.routes())
app.use(router.allowedMethods())
app.listen(8080,()=>console.log("Server running on port 8080"))