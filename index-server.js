const Koa =require( 'koa')
const Router =require( 'koa-router')
const serve = require('koa-static')
import React from 'react'
import {renderToString} from 'react-dom/server'


const app = new Koa()
const router = new Router()

const html = renderToString(<Menu recipes={data}/>)

router.get('*', ctx => {
    ctx.body = `<!DOCTYPE html>
<html>
<head>
<title>React Recipes App</title>
</head>
<body>nno
<div id="react-container"></div>
<script >window.__DATA__=${JSON.stringify(data)}</script>
<script src="/bundle.js"></script>
</body>
</html>`
})
app.use(router.routes())
app.use(serve(__dirname + '/public'))
app.listen(3000, () =>
    console.log(`Recipe app running at 'http://localhost:3000'`)
)

