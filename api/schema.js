module.exports= `
type Person {
    id:String!,
    first_name: String!,
    last_name: String!,
    username: String!,
    email: String!,
    cellphone: Int!,
    birthday: String!,
    twinpals: [Person!]!,
    profile_picture: String!,
    location: String!,
    groups_member: [Group!]!,
    groups_admin: [Group!]!,
    pages_liked: [Page!]!,
    posts: [Post!]!,
    date_joined: String!,
    uploads: [Upload!]!,
    shares: [Post!]!,
    liked_posts: [Post!]!,
    twinpal_requests: [TwinpalRequest!]!
}
type TwinpalRequest {
    id:String!,
    from: Person!,
    timestamp: String!
}
type PostLikes {
    id:String!,
    liked_by: Person!,
    timestamp: String!
}
type PostShares {
    id:String!,
    shared_by: Person!,
    timestamp: String!
}
type Post {
    id:String!,
    body: String!,
    timestamp: String!,
    author: Person!,
    likes: [PostLikes!]!,
    shares: [PostShares!]!,
    scope: String!,
    status: String!,
    uploads: [Upload!]!,
    profile: Person!
}
type Upload {
    id:String!,
    path: String!,
    uploader: Person!,
    timestamp: String!
}
type Group {
    id:String!,
    name: String!,
    members: [Person!]!,
    admin: [Person!]!
}
type Admin {
    id:String!,
    email: String!,
    email2: String!,
    cellphone: Int!,
    username: String!,
    date_assigned: String!
}
type PageFuns {
    id:String!,
    person: Person!,
    timestamp: String!
}
type Page {
    id:String!,
    name: String!,
    timestamp: String!,
    likes: [PageFuns!]!
}
type CommentReplies{
    id:String!,
    author: Person!,
    body: String!,
    timestamp: String!,
    likes: [Person!]!,
}
type Comment {
    id:String!,
    author: String!,
    body:String!,
    post: Post!,
    replies: [CommentReplies!]!,
    timestamp:String!,
    likes: [Person!]!
}
type Query{
allUsers:[Person!]!
}
`
