module.exports= `
type Team {
id:String!
owner:User!
members:[User!]!
channels:[Channel!]!
}
type Channel {
id:String!
name:String!
message:[Message!]!
isPublic:Boolean!

}

type Message {
id:String!
text:String!
user:User!
channel:Channel!
}

type User {
id:String!
username:String! 
email:String!
team:[Team!]!
getUser:String!
}
type Query {
allUsers:[User!]!
}
type Mutation{
createUser(username:String!,email:String!,password:String!):User!
}
`