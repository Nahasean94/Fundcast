/***
 *
 * This file contains all the graphql queries and mutations. These are responsible for receiving and responding to requests from the front end.
 */

const queries = require('../databases/queries')
const {GraphQLObjectType, GraphQLString, GraphQLSchema, GraphQLID, GraphQLInt, GraphQLList, GraphQLBoolean,} = require('graphql')//import various modules from graphql
const {GraphQLUpload} = require('apollo-upload-server')//this module will help us upload files to the server
const authentication = require('./middleware/authenticate')//this module helps us authenticate various requests since multiple people with different access levels use the system
const fs = require('fs')//this will help us create and manipulate the file system
const mkdirp = require('mkdirp')//will help use create new folders
const shortid = require('shortid')//will help us name each upload uniquely

//Store the upload
const storeFS = ({stream}, {filename}, id, uploader) => {
    const uploadDir = `./public/uploads/${uploader}`

// Ensure upload directory exists
    mkdirp.sync(uploadDir)

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
            .on('finish', () => resolve())
    )
}
//process the upload and also store the path in the database
const processUpload = async (upload, profile, uploader) => {
    const id = shortid.generate()
    const {stream, filename,} = await upload.file
    const path = `${uploader}/${id}-${filename}`
    return await storeFS({stream, filename}, id, uploader).then(() =>
        queries.storeUpload(path, upload.caption, uploader))
}
const getMeta = async (file) => {
    const {stream, filename} = await file
    return {stream, filename}
}
const createNewPodcast = async (newPodcast, uploader) => {

    const podcastId = shortid.generate()
    const coverImageId = shortid.generate()


    const coverImageName = async () => {
        let {filename} = await getMeta(newPodcast.coverImage)
        return filename
    }
    const podcastName = async () => {
        let {filename} = await getMeta(newPodcast.podcast)
        return filename
    }
    const podcastPath = `${uploader}/${podcastId}-${await podcastName()}`
    const coverImagePath = `${uploader}/${coverImageId}-${await coverImageName()}`
    const audioFile = await storeFS(await getMeta(newPodcast.podcast), await getMeta(newPodcast.podcast), podcastId, uploader).then(async () =>
        queries.storeUpload(podcastPath, newPodcast.title, uploader))

    const coverImage = await storeFS(await getMeta(newPodcast.coverImage), await getMeta(newPodcast.coverImage), coverImageId, uploader).then(async () =>
        queries.storeUpload(coverImagePath, newPodcast.title, uploader))
    const finalPodcast = {
        title: newPodcast.title,
        description: newPodcast.description,
        timestamp: new Date(),
        hosts: newPodcast.hosts,
        tags: newPodcast.tags,
        status: "original",
        coverImage: coverImage.id,
        audioFile: audioFile.id,
        paid: newPodcast.paid
    }
    return await queries.createNewPodcast(uploader, finalPodcast)
}

//process the profile picture
const processProfilePicture = async (upload, uploader) => {
    const id = shortid.generate()
    const {stream, filename,} = await upload
    const path = `${uploader}/${id}-${filename}`
    return await storeFS({stream, filename}, id, uploader).then(() =>
        queries.storeProfilePicture(path, uploader))
}


const PersonType = new GraphQLObjectType({
    name: 'Person',
    fields: () => ({
        id: {type: GraphQLID},
        username: {type: GraphQLString},
        email: {type: GraphQLString},
        role: {type: GraphQLString},
        profile_picture: {type: GraphQLString},
        date_joined: {type: GraphQLString},
        address: {type: GraphQLString},
    })
})

const UploadType = new GraphQLObjectType({
    name: 'Uploads',
    fields: () => ({
        id: {type: GraphQLID},
        uploader: {
            type: PersonType,
        },
        path: {type: GraphQLString},
        timestamp: {type: GraphQLString},
    })
})
const BuyerType = new GraphQLObjectType({
    name: 'Buyer',
    fields: () => ({
        id: {type: GraphQLID},
        buyer: {
            type: GraphQLID
        },
        timestamp: {
            type: GraphQLString
        },
        amount: {
            type: GraphQLInt
        },
    })
})

const PaymentType = new GraphQLObjectType({
    name: 'Payment',
    fields: () => ({
        id: {type: GraphQLID},
        paid: {
            type: GraphQLBoolean,
        },
        amount: {type: GraphQLInt},
        timestamp: {type: GraphQLString},
        buyers: {
            type: BuyerType,
            async resolve(parent, args) {
                // return await queries.findPodcastPayments(parent).then(async likers => {
                //      const {likes} = likers
                //      return likes
                //  })
            }
        }
    })
})
const PodcastType = new GraphQLObjectType({
    name: 'Podcast',
    fields: () => ({
        id: {type: GraphQLID},
        title: {type: GraphQLString},
        description: {type: GraphQLString},
        tags: {type: new GraphQLList(GraphQLString)},
        listens: {type: GraphQLInt},
        hosts: {
            type: new GraphQLList(PersonType),
            resolve(parent, args) {
                return parent.hosts.map(host => {
                    return queries.findUser({id: host})
                })
            }
        },
        likes: {
            type: new GraphQLList(LikeType),
            async resolve(parent, args) {
                return await queries.findPodcastLikes(parent).then(async likers => {
                    const {likes} = likers
                    return likes
                })
            }
        },
        audioFile: {
            type: UploadType,
            async resolve(parent, args) {
                return await queries.findPodcastFile(parent).then(async podcastFile => {
                    const {audioFile} = podcastFile
                    return await queries.findUpload({id: audioFile})

                })

            }
        },
        coverImage: {
            type: UploadType,
            async resolve(parent, args) {
                return await queries.findPodcastCoverImage(parent).then(async podcastCoverImage => {
                    const {coverImage} = podcastCoverImage
                    return await queries.findUpload({id: coverImage})

                })

            }
        },

        timestamp: {type: GraphQLString},

        comments: {
            type: new GraphQLList(CommentType),
            async resolve(parent, args) {
                return await queries.findPodcastComments(parent).then(async podcastComments => {
                    const {comments} = podcastComments
                    const populatedComments = []
                    if (comments.length > 0) {
                        for (let i = comments.length - 1; i >= 0; i--) {
                            populatedComments.push(await queries.findComment({id: comments[i]}))
                        }
                    }
                    return populatedComments
                })

            }
        },
        payment: {
            type: PaymentType
        }
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
        podcast: {
            type: PodcastType,
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
const isUserExistsType = new GraphQLObjectType({
    name: 'isUserExists',
    fields: () => ({
        exists: {type: GraphQLBoolean},
    })
})
const UpdloadProfilePictureType = new GraphQLObjectType({
    name: 'UpdloadProfilePicture',
    fields: () => ({
        uploaded: {type: GraphQLBoolean},
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
        podcast: {
            type: PodcastType,
            args: {id: {type: GraphQLID}},
            resolve(parent, args) {
                return queries.findPodcast(args)
            }
        },
        podcasts: {
            type: new GraphQLList(PodcastType),
            resolve: () => {
                return queries.findAllPodcasts()
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
        fetchUserProfile: {
            type: PersonType,
            args: {id: {type: GraphQLID}},
            async resolve(parent, args, ctx) {
                return await queries.findUser({id: args.id})
            }
        },
        fetchProfilePodcasts: {
            type: new GraphQLList(PodcastType),
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async person => {
                    let allPodcasts = []
                    return await queries.findUserPodcasts(person.id).then(async (userPodcasts) => {
                        const podcasts = userPodcasts
                        if (podcasts.length < 1) {
//todo sth
                        }
                        else {
                            for (let j = 0; j < podcasts.length; j++) {
                                allPodcasts.push(await queries.findPodcast({id: podcasts[j]}))
                            }
                        }
                    }).then(() => {
                        return allPodcasts
                    }).catch(function (err) {
                        console.log(err)
                    })
                })

            }
        },
        findPodcastComments: {
            type:new GraphQLList(CommentType),
            args: {podcast_id: {type: GraphQLID}},
            async resolve(parent, args) {
                return await queries.findPodcastComments(args.podcast_id)

            }
        },
        fetchUserPodcasts: {
            type: new GraphQLList(PodcastType),
            args: {id: {type: GraphQLID}},
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async person => {
                    let allPodcasts = []
                    return await queries.findUserPodcasts(args.id).then(async (userPodcasts) => {
                        const podcasts = userPodcasts
                        if (podcasts.length < 1) {

                        }
                        else {
                            for (let j = 0; j < podcasts.length; j++) {
                                allPodcasts.push(await queries.findPodcast({id: podcasts[j]}))
                            }
                        }
                    }).then(() => {
                        return allPodcasts
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
                username: {type: GraphQLString},
                email: {type: GraphQLString},
                password: {type: GraphQLString},
                role: {type: GraphQLString},
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
                username: {type: GraphQLString},
                email: {type: GraphQLString},
                password: {type: GraphQLString},
                role: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async ({id}) => {
                    return await queries.updateProfile(id, args).then(person => {
                        return person
                    })
                })
            }
        },
        likePodcast: {
            type: PodcastType,
            args: {
                id: {type: GraphQLID},
            },
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async ({id}) => {
                    return await queries.likePodcast(id, args.id).then(podcast => {
                        return podcast
                    })
                })
            }
        },
        unlikePodcast: {
            type: PodcastType,
            args: {
                id: {type: GraphQLID},
            },
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async ({id}) => {
                    return await queries.unlikePodcast(id, args.id).then(podcast => {
                        return podcast
                    })
                })
            }
        },
        updatePodcast: {
            type: PodcastType,
            args: {
                id: {type: GraphQLID},
                body: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async ({id}) => {
                    return await queries.updatePodcast(args).then(podcast => {
                        return podcast
                    })
                })
            }
        },
        deletePodcast: {
            type: PodcastType,
            args: {
                id: {type: GraphQLID},
                body: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async ({id}) => {
                    return await queries.deletePodcast(id, args.id).then(podcast => {
                        return podcastlik
                    })
                })
            }
        },
        addComment: {
            type: CommentType,
            args: {
                podcast_id: {type: GraphQLID},
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
        newPodcast: {
            type: PodcastType,
            args: {
                title: {type: GraphQLString},
                description: {type: GraphQLString},
                hosts: {type: new GraphQLList(GraphQLString)},
                paid: {type: GraphQLInt},
                tags: {type: GraphQLString},
                coverImage: {type: GraphQLUpload},
                podcast: {type: GraphQLUpload},
            },
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                if (id) {
                    return await createNewPodcast(args, id)
                }

            }
        },
        uploadFile: {
            type: PodcastType,
            args: {
                file: {type: GraphQLUpload},
                caption: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                return await processUpload(args, id)
            }
        },
        uploadProfilePicture: {
            type: UpdloadProfilePictureType,
            args: {
                file: {type: GraphQLUpload},
            },
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                return !!(await processProfilePicture(args.file, id))
            }

        }
    },

})

module.exports = new GraphQLSchema({query: RootQuery, mutation: Mutation})