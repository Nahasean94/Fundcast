// const Koa =require( 'koa')
// const Router =require( 'koa-router')
// const mongoose =require( 'mongoose')
// const koaBody =require( 'koa-bodyparser')
// const cors =require( 'koa2-cors')
// const graphqlHTTP = require('koa-graphql')
// const serve =require( 'koa-static-server')
// const schema = require('./api/schema')
//
// const router = new Router()
// const app = new Koa()
// // app.use(serve({rootDir:'public',path:'/public'}))
//
// //Connect to Mongodb
// mongoose.connect('mongodb://localhost/practice', {promiseLibrary: global.Promise})
//
// app.use(koaBody())
// router.post('/graphql', graphqlHTTP({schema,graphiql:true}))
// router.get('/graphql', graphqlHTTP({schema,graphiql:true}))
// // router.get('/graphiql', graphiqlKoa({endpointURL: '/graphql',}))
//
//
//
// app.use(cors())
// app.use(router.routes())
// app.use(router.allowedMethods())
//
// app.listen(8081,()=>{
//     console.log("server started at port 8081")
// })


 const Koa =require( 'koa')
 const Router =require( 'koa-router')
 const koaBody =require( 'koa-bodyparser')
const serve =require( 'koa-static-server')
const cors =require( 'koa2-cors')
 const { graphqlKoa, graphiqlKoa } =require( 'apollo-server-koa')
 const schema =require( './api/graphql_schema')

 const app = new Koa();
 const router = new Router();
app.use(serve({rootDir:'public',path:'/public'}))
 // koaBody is needed just for POST.
router.post('/graphql',koaBody(),
    (context, next) => graphqlKoa({
        schema,
        context,
    })(context, next),
)
 // router.post('/graphql', koaBody(), graphqlKoa({ schema: schema ,context: app.context}));
 router.get('/graphql', graphqlKoa({ schema: schema,context: app.context }));

 router.get('/graphiql', graphiqlKoa({ endpointURL: '/graphql' }));


app.use(cors())
 app.use(router.routes());
 app.use(router.allowedMethods());
 app.listen(8080,()=>console.log("Server started on port 8080"));
