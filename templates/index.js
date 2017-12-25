"use strict"
const Koa =require('koa')
const Router=require('koa-router')
const KoaBody=require('koa-body')
const cors = require('koa2-cors')
const users=require('./routes/users')
const events=require('./routes/events')
const authenticate=require('./middleware/authenticate')

const app=new Koa()
const router=new Router()
const koaBody = new KoaBody({
    multipart: true,
    formidable: {uploadDir: './public/uploads', keepExtensions: true}
})

router.post('/api/users',koaBody,users.registerUser)
router.get('/api/users/:email',users.checkUserExists)
router.post('/api/login',koaBody,users.userLogin)
router.post('/api/events',koaBody,authenticate,events.createEvent)
app.use(router.routes())
app.use(cors())
app.listen(8080,()=>console.log("Running on port 8080"))