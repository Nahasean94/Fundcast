const queries = require('../databases/queries')
const {GraphQLObjectType, GraphQLString, GraphQLSchema, GraphQLID, GraphQLInt, GraphQLList, GraphQLBoolean,GraphQLScalarType} = require('graphql')
const {GraphQLUpload}=require('apollo-upload-server')
const authentication = require('./middleware/authenticate')
const fs =require( 'fs')
const promisesAll =require( 'promise-all')
const mkdirp =require( 'mkdirp')
const shortid =require( 'shortid')


const uploadDir = './uploads'
// const db = lowdb(new FileSync('db.json'))
//
// // Seed an empty DB
// db.defaults({ uploads: [] }).write()

// Ensure upload directory exists
mkdirp.sync(uploadDir)

const storeFS = ({ stream, filename },uploader) => {
    const id = shortid.generate()
    const path = `${uploadDir}/${id}-${filename}`
    return new Promise((resolve, reject) =>
        stream
            .on('error', error => {
                if (stream.truncated)
                // Delete the truncated file
                    fs.unlinkSync(path)
                reject(error)
            })
            .pipe(fs.createWriteStream(path))
            .on('error', error => reject(error))
            .on('finish', () => resolve({ id, path }))
    )
}

const processUpload = async (upload,uploader) => {
    const { stream, filename, mimetype, encoding } = await upload
  return  await storeFS({ stream, filename },uploader).then(()=> true)
    // return storeDB({ id, filename, mimetype, encoding, path })
}


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
        // uploads: {
        //     type: new GraphQLList(UploadType),
        //     async resolve(parent, args) {
        //         return await queries.findUserUploads(parent).then(async userUploads => {
        //             const {uploads} = userUploads
        //             if (uploads.length > 0) {
        //                 return await uploads.map(async upload => await queries.findUpload({id: uploads}))
        //             }
        //             return uploads
        //         })
        //     }
        // },
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
    name: 'Uploads',
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
// const typeDefs=require('./modules/schema')
// const resolvers=require('./modules/resolvers')
// const graphqlTools =require('graphql-tools')
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
        comments: {
            type: new GraphQLList(CommentType),
            async resolve(parent, args) {
                return await queries.findPostComments(parent).then(async postComments => {
                    const {comments} = postComments
                    const populatedComments=[]
                    if (comments.length > 0) {
                        for (let i = comments.length-1; i >=0 ; i--) {
                           populatedComments.push(await queries.findComment({id: comments[i]}))
                        }
                    }
                        return populatedComments
                })

            }
        },
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
            async resolve(parent, args) {
                return await queries.findUser({id: parent.author})
            }
        },
        body: {type: GraphQLString},
        post: {
            type: PostType,
            resolve(parent, args) {
//TODO do we really need this resolver?
            }
        },
        likes: {
            type: new GraphQLList(LikeType),
            resolve(parent, args) {
//TODO add this resolver when we start liking comments
            }
        },
        replies: {
            type: new GraphQLList(CommentRepliesType),
            resolve(parent, args) {
//TODO add this resolver when we add replies
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
const CustomType = new GraphQLScalarType({
    name: 'Custom',
    fields: () => ({
        file: {type: GraphQLUpload},
    }),
    serialize: value => value,
    parseValue: value => value,
    parseLiteral: (ast) => {
        if (ast.kind !== Kind.OBJECT) {
            throw new GraphQLError(
                `Query error: Can only parse object but got a: ${ast.kind}`,
                [ast],
            );
        }
        return ast.value;
    },
})

// function oddValue(value) {
//     return value % 2 === 1 ? value : null;
// }


const isUserExistsType = new GraphQLObjectType({
    name: 'isUserExists',
    fields: () => ({
        exists: {type: GraphQLBoolean},
    })
})
// const processUpload = async upload => {
//     const { stream, filename, mimetype, encoding } = await upload
//     console.log(filename)
//     const { id, path } = await storeFS({ stream, filename })
//     return storeDB({ id, filename, mimetype, encoding, path })
// }
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

                                }
                                else {
                                    for (let j = 0; j < posts.length; j++) {
                                        allPosts.push(await queries.findPost({id: posts[j]}))
                                        // allPosts.push(await this.post({id:posts[i]}))
                                    }
                                }

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
        fetchPalProfile: {
            type: PersonType,
            args: {id: {type: GraphQLID}},
            async resolve(parent, args, ctx) {

                return await queries.findUser({id: args.id})
            }
        },
        fetchProfilePosts: {
            type: new GraphQLList(PostType),
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async person => {
                    let allPosts = []
                    return await queries.findUserPosts(person.id).then(async (userPosts) => {
                        const {posts} = userPosts
                        if (posts.length < 1) {

                        }
                        else {
                            for (let j = 0; j < posts.length; j++) {
                                allPosts.push(await queries.findPost({id: posts[j]}))
                            }
                        }
                    }).then(() => {
                        return allPosts
                    }).catch(function (err) {
                        console.log(err)
                    })
                })

            }
        },
        fetchPalPosts: {
            type: new GraphQLList(PostType),
            args: {id: {type: GraphQLID}},
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async person => {
                    let allPosts = []
                    return await queries.findUserPosts(args.id).then(async (userPosts) => {
                        const {posts} = userPosts
                        if (posts.length < 1) {

                        }
                        else {
                            for (let j = 0; j < posts.length; j++) {
                                allPosts.push(await queries.findPost({id: posts[j]}))
                            }
                        }
                    }).then(() => {
                        return allPosts
                    }).catch(function (err) {
                        console.log(err)
                    })
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
                    return {exists: !!person}

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
        updateProfile: {
            type: PersonType,
            args: {
                id: {type: GraphQLID},
                first_name: {type: GraphQLString},
                last_name: {type: GraphQLString},
                username: {type: GraphQLString},
                email: {type: GraphQLString},
                birthday: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async ({id}) => {
                    return await queries.updateProfile(id,args).then(person => {
                        return person
                    })
                })
            }
        },
        likePost: {
            type: PostType,
            args: {
                id: {type: GraphQLID},
            },
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async ({id}) => {
                    return await queries.likePost(id, args.id).then(post => {
                        return post
                    })
                })
            }
        },
        unlikePost: {
            type: PostType,
            args: {
                id: {type: GraphQLID},
            },
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async ({id}) => {
                    return await queries.unlikePost(id, args.id).then(post => {
                        return post
                    })
                })
            }
        },
        updatePost: {
            type: PostType,
            args: {
                id: {type: GraphQLID},
                body: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async ({id}) => {
                    return await queries.updatePost(args).then(post => {
                        return post
                    })
                })
            }
        },
        deletePost: {
            type: PostType,
            args: {
                id: {type: GraphQLID},
                body: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async ({id}) => {
                    return await queries.deletePost(id, args.id).then(post => {
                        return post
                    })
                })
            }
        },
        addComment: {
            type: PostType,
            args: {
                post_id: {type: GraphQLID},
                comment: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async ({id}) => {
                    return await queries.storeComment(id, args).then(comment => {
                        return comment
                    })
                })
            }
        },
        newPost: {
            type: PostType,
            args: {
                body: {type: GraphQLString},
                profile: {type: GraphQLID},
            },
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async ({id}) => {
                    return await queries.createNewPost(id, args).then(post => {
                        return post
                    })
                })
            }
        },
        uploadFile: {
            type:GraphQLUpload ,
            args: {
                file: {type: GraphQLUpload},
                uploader:{type:GraphQLString}
            },
             resolve(parent, args, ctx,...rest) {
                processUpload(args.file,args.uploader)
            }
        },
    }
})

// const schema1=new GraphQLSchema({ typeDefs, resolvers })
// const schema2=
// console.log(schema1)
// console.log(schema2)
module.exports = new GraphQLSchema({query: RootQuery, mutation: Mutation})