module.exports= `
  scalar Upload
  type File {
    id: ID!
    path: String!
    filename: String!
    mimetype: String!
    encoding: String!
  }
  type Query {
    uploads: [File]
  }
  type Mutation {
    singleUpload (file: Upload!): File!
    multipleUpload (files: [Upload!]!): [File!]!
  }
  
  type Person{
  id:ID!
first_name:String!
last_name:String!
username:String!
email:String!
cellphone:Int!
birthday:String!
profile_picture:String!
location:String!
date_joined:String!
twinpals:[Person]
groups_member:[Group]
groups_admin:[Group]
pages_liked:[Page]
posts:[Post]
shares:[SharedPosts]
liked_posts:[Like]
twinpal_requests:[TwinpalRequest]
  }
  
  
    `