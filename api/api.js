import Koa from 'koa'
import Router from 'koa-router'
import mongoose from 'mongoose'
import koaBody from 'koa-bodyparser'
import cors from 'koa2-cors'
import {Person, Group, Page, Comment, Admin, Upload, Post} from '../databases/schemas'
const {graphqlKoa,graphiqlKoa } = require('apollo-server-koa')
const {makeExecutableSchema} = require('graphql-tools')
const typeDefs = require('./schema')
const resolvers = require('./resolvers')
// const koaBody = new KoaBody({
//     multipart: true,
//     formidable: {uploadDir: './public/uploads', keepExtensions: true}
// })

const router = new Router()
const app = new Koa()
//Connect to Mongodb
mongoose.connect('mongodb://localhost/practice', {promiseLibrary: global.Promise})

app.use(koaBody())
const schema = makeExecutableSchema({
    typeDefs,
    resolvers
})
router.post('/graphql', graphqlKoa({schema, context: {Person, Group, Page, Comment, Admin, Upload, Post}}))
router.get('/graphql', graphqlKoa({schema, context: {Person, Group, Page, Comment, Admin, Upload, Post}}))
router.get('/graphiql', graphiqlKoa({endpointURL: '/graphql',}))



app.use(cors())
app.use(koaBody())
app.use(router.routes())
app.use(router.allowedMethods())


module.exports = app