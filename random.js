const koa =require('koa'); // koa@2
const koaRouter=require('koa-router');
const koaBody =require( 'koa-bodyparser');
const  { graphqlKoa } =require( 'apollo-server-koa');
const queries=require('./databases/queries')
const  { graphiqlKoa } =require( 'apollo-server-koa');

const app = new koa();
const router = new koaRouter();
const PORT = 3000;
const { makeExecutableSchema } = require('graphql-tools');

// Some fake data
// const users = queries.findUsers()

// The GraphQL schema in string form
const typeDefs = `
  type Query { users: [User] }
  type User {
   _id:ID,
   first_name: String,
    last_name: String,
    username: String,
    email:  String,
    cellphone: Int,
    password: String,
    birthday: String,
    profile_picture: String,
    location: String,

    date_joined: String}
`;

// The resolvers
const resolvers = {
    Query: { users: () => queries.findUsers() },
};

// Put together a schema
const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});


// Setup the /graphiql route to show the GraphiQL UI
router.get(
    '/graphiql',
    graphiqlKoa({
        endpointURL: '/graphql', // a POST endpoint that GraphiQL will make the actual requests to
    }),
);
// koaBody is needed just for POST.

router.post('/graphql', graphqlKoa({ schema: schema }));
router.get('/graphql', graphqlKoa({ schema: schema }));
app.use(koaBody());
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(7000, () => {
    console.log('Go to http://localhost:7000/graphiql to run queries!');
});


