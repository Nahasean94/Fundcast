"use strict"
import app from './api/app'
import api from './api/api'
import serve from 'koa-static-server'
api.use(serve({rootDir:'public',path:'/public'}))
api.listen(8081,()=>{
  console.log("server started at port 8081")
})