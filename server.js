"use strict"
const app=require('./api/app')
const serve=require('koa-static-server')
app.use(serve({rootDir:'public',path:'/public'}))
app.listen(8080,()=>{
  console.log("server started at port 8080")
})