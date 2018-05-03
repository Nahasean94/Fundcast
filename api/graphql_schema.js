const queries = require('../databases/queries')
const {GraphQLObjectType, GraphQLString, GraphQLSchema, GraphQLID, GraphQLInt, GraphQLList, GraphQLBoolean} = require('graphql')
const authentication = require('./middleware/authenticate')
const PersonType = new GraphQLObjectType({
    name: 'Person',
    fields: () => ({
        id: {type: GraphQLID},
        first_name: {type: GraphQLString},
        last_name: {type: GraphQLString},
        username: {type: GraphQLString},
        email: {type: GraphQLString},
        cellphone: {type: GraphQLInt},
        birthday: {type: GraphQLString},
        profile_picture: {type: GraphQLString},
        location: {type: GraphQLString},
        date_joined: {type: GraphQLString},
        twinpals: {
            type: new GraphQLList(PersonType),
            async resolve(parent, args) {
                return await queries.findTwinpals(parent)
            }
        },
        groups_member: {
            type: new GraphQLList(GroupType),
            resolve(parent, args) {

            }
        },
        groups_admin: {
            type: new GraphQLList(GroupType),
            resolve(parent, args) {

            }
        },
        pages_liked: {
            type: new GraphQLList(PageType),
            resolve(parent, args) {

            }
        },
        posts: {
            type: new GraphQLList(PostType),
            async resolve(parent, args) {
                return await queries.findUserPosts(parent).then(async userPosts => {
                    const {posts} = userPosts
                    if (posts.length > 0) {
                        return await posts.map(async post => await queries.findPost({id: post}))
                    }
                    return posts
                })
            }
        },
        uploads: {
            type: new GraphQLList(UploadType),
            async resolve(parent, args) {
                return await queries.findUserUploads(parent).then(async userUploads => {
                    const {uploads} = userUploads
                    if (uploads.length > 0) {
                        return await uploads.map(async upload => await queries.findUpload({id: uploads}))
                    }
                    return uploads
                })
            }
        },
        shares: {
            type: new GraphQLList(SharedPostsType),
            resolve(parent, args) {

            }
        },
        liked_posts: {
            type: new GraphQLList(LikedPostsType),
            async resolve(parent, args) {
                return await queries.findLikedPosts(parent).then(async likedPosts => {
                    const {liked_posts} = likedPosts
                    if (liked_posts.length > 0) {
                        return await liked_posts.map(async post => await queries.findPost({id: liked_posts}))
                    }
                    return liked_posts
                })
            }
        },
        twinpal_requests: {
            type: new GraphQLList(TwinpalRequestType),
            resolve(parent, args) {

            }
        },
    })
})
const TwinpalRequestType = new GraphQLObjectType({
    name: 'TwinpalRequest',
    fields: () => ({
        id: {type: GraphQLID},
        from: {
            type: PersonType,
            resolve(parent, args) {

            }
        },
        timestamp: {type: GraphQLString},
    })
})
const LikedPostsType = new GraphQLObjectType({
    name: 'LikedPosts',
    fields: () => ({
        id: {type: GraphQLID},
        post: {
            type: new GraphQLList(PostType),
            resolve(parent, args) {

            }
        },
        timestamp: {type: GraphQLString},
    })
})
const SharedPostsType = new GraphQLObjectType({
    name: 'SharedPosts',
    fields: () => ({
        id: {type: GraphQLID},
        post: {
            type: new GraphQLList(PostType),
            resolve(parent, args) {

            }
        },
        timestamp: {type: GraphQLString},
    })
})
const PostLikesType = new GraphQLObjectType({
    name: 'PostLikes',
    fields: () => ({
        id: {type: GraphQLID},
        liked_by: {
            type: PersonType,
            resolve(parent, args) {

            }
        },
        timestamp: {type: GraphQLString},
    })
})
const PostSharesType = new GraphQLObjectType({
    name: 'PostShares',
    fields: () => ({
        id: {type: GraphQLID},
        shared_by: {
            type: PersonType,
            resolve(parent, args) {

            }
        },
        timestamp: {type: GraphQLString},
    })
})
const UploadType = new GraphQLObjectType({
    name: 'Upload',
    fields: () => ({
        id: {type: GraphQLID},
        uploader: {
            type: PersonType,
            resolve(parent, args) {

            }
        },
        path: {type: GraphQLString},
        timestamp: {type: GraphQLString},
    })
})
const PostType = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
        id: {type: GraphQLID},
        body: {type: GraphQLString},
        author: {
            type: PersonType,
            resolve(parent, args) {
                return queries.findUser({id: parent.author})
            }
        },
        shares: {
            type: new GraphQLList(PostSharesType),
            resolve(parent, args) {

            }
        },
        likes: {
            type: new GraphQLList(LikeType),
            async resolve(parent, args) {
                return await queries.findPostLikes(parent).then(async likers => {
                    const {likes} = likers
                    return likes
                })
            }
        },
        profile: {
            type: PersonType,
            async resolve(parent, args) {
                return await queries.findUser({id: parent.profile})
            }
        },
        uploads: {
            type: new GraphQLList(UploadType),
            async resolve(parent, args) {
                return await queries.findPostUploads(parent).then(async postUploads => {
                    const {uploads} = postUploads
                    if (uploads.length > 0) {
                        return await uploads.map(async upload => {
                            return await queries.findUpload({id: upload})
                        })
                    }
                    return uploads
                })

            }
        },
        scope: {type: GraphQLString},
        status: {type: GraphQLString},
        timestamp: {type: GraphQLString},
        //TODO add comments
    })
})
const GroupType = new GraphQLObjectType({
    name: 'Group',
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        members: {
            type: new GraphQLList(PersonType),
            resolve(parent, args) {

            }
        },
        admins: {
            type: new GraphQLList(PersonType),
            resolve(parent, args) {

            }
        },
        timestamp: {type: GraphQLString},
    })
})
const AdminType = new GraphQLObjectType({
    name: 'Admin',
    fields: () => ({
        id: {type: GraphQLID},
        username: {type: GraphQLString},
        email1: {type: GraphQLString},
        email2: {type: GraphQLString},
        cellphone: {type: GraphQLInt},
        members: {
            type: new GraphQLList(PersonType),
            resolve(parent, args) {

            }
        },
        admins: {
            type: new GraphQLList(PersonType),
            resolve(parent, args) {

            }
        },
        date_assigned: {type: GraphQLString},
    })
})
const LikeType = new GraphQLObjectType({
    name: 'Like',
    fields: () => ({
        id: {type: GraphQLID},
        person: {
            type: PersonType,
            async resolve(parent, args) {
                return await queries.findUser({id: parent.liked_by})
            }
        },
        timestamp: {type: GraphQLString},
    })
})
const PageType = new GraphQLObjectType({
    name: 'Page',
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        likes: {
            type: new GraphQLList(LikeType),
            resolve(parent, args) {

            }
        },
        timestamp: {type: GraphQLString},
    })
})
const CommentRepliesType = new GraphQLObjectType({
    name: 'CommentReplies',
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        author: {
            type: PersonType,
            resolve(parent, args) {

            }
        },
        body: {type: GraphQLString},
        likes: {
            type: new GraphQLList(LikeType),
            resolve(parent, args) {

            }
        },
        timestamp: {type: GraphQLString},
    })
})
const CommentType = new GraphQLObjectType({
    name: 'Comment',
    fields: () => ({
        id: {type: GraphQLID},
        author: {
            type: PersonType,
            resolve(parent, args) {

            }
        },
        body: {type: GraphQLString},
        post: {
            type: PostType,
            resolve(parent, args) {

            }
        },
        likes: {
            type: new GraphQLList(LikeType),
            resolve(parent, args) {

            }
        },
        replies: {
            type: new GraphQLList(CommentRepliesType),
            resolve(parent, args) {

            }
        },
        timestamp: {type: GraphQLString},
    })
})
const TokenType = new GraphQLObjectType({
    name: 'Token',
    fields: () => ({
        ok: {type: GraphQLBoolean},
        token: {type: GraphQLString},
        error: {type: GraphQLString}
    })
})
const isUserExistsType = new GraphQLObjectType({
    name: 'isUserExists',
    fields: () => ({
        exists: {type: GraphQLBoolean},
    })
})

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        person: {
            type: PersonType,
            args: {id: {type: GraphQLID}},
            resolve(parent, args) {
                return queries.findUser({id: args.id})
            }
        },
        people: {
            type: new GraphQLList(PersonType),
            resolve: () => {
                return queries.findAllUsers()
            }
        },
        post: {
            type: PostType,
            args: {id: {type: GraphQLID}},
            resolve(parent, args) {
                return queries.findPost({id: args.id})
            }
        },
        posts: {
            type: new GraphQLList(PostType),
            resolve: () => {
                return queries.findAllPosts()
            }
        },

        fetchNewsFeed: {
            type: new GraphQLList(PostType),
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async person => {
                    let allPosts = []
                    return await queries.findTwinpals(person).then(async (twinpals) => {
                        twinpals.push({_id: person.id})
                        for (let i = 0; i < twinpals.length; i++) {
                            await queries.findUserPosts(twinpals[i]._id).then(async (userPosts) => {
                                const {posts} = userPosts
                                if (posts.length < 1) {
                                    // console.log(twinpals[i])
                                }
                                else {
                                    for (let j = 0; j < posts.length; j++) {
                                        allPosts.push(await queries.findPost({id: posts[j]}))
                                        // allPosts.push(await this.post({id:posts[i]}))
                                    }
                                }
                                // console.log(allPosts)
                            }).catch(function (err) {
                                console.log(err)
                            })
                        }
                        return allPosts
                    }).catch(function (err) {
                        return {error: err}
                    })

                })

            }
        },
        getProfileInfo: {
            type: PersonType,
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async ({id}) => {
                    return await queries.findUser({id: id})
                })
            }
        },
        fetchProfilePosts: {
            type: new GraphQLList(PostType),
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async person => {
                    let allPosts = []
                    // return await queries.findTwinpals(person).then(async (twinpals) => {
                    // twinpals.push({_id: person.id})
                    // for (let i = 0; i < twinpals.length; i++) {
                    return await queries.findUserPosts(person.id).then(async (userPosts) => {
                        const {posts} = userPosts
                        if (posts.length < 1) {
                            // console.log(twinpals[i])
                        }
                        else {
                            for (let j = 0; j < posts.length; j++) {
                                allPosts.push(await queries.findPost({id: posts[j]}))
                                // allPosts.push(await this.post({id:posts[i]}))
                            }
                        }
                        // console.log(allPosts)
                    }).then(() => {
                        return allPosts
                    }).catch(function (err) {
                        console.log(err)
                    })
                    // }
                    // return allPosts
                    // }).catch(function (err) {
                    //     return {error: err}
                    // })

                })

            }
        }

    }
})
const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        login: {
            type: TokenType,
            args: {
                email: {type: GraphQLString},
                password: {type: GraphQLString}
            },
            async resolve(parent, args, ctx) {
                return await authentication.login(args).then(login => {
                    return login
                })

            }
        },
        isUserExists: {
            type: isUserExistsType,
            args: {
                email: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.isUserExists(args).then(person => {
                    return {exists:!!person}

                })

            }
        },
        signup: {
            type: PersonType,
            args: {
                first_name: {type: GraphQLString},
                last_name: {type: GraphQLString},
                email: {type: GraphQLString},
                password: {type: GraphQLString},
                birthday: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.signup(args).then(person => {
                    return person
                })
            }
        },
    }
})
module.exports = new GraphQLSchema({query: RootQuery, mutation: Mutation})