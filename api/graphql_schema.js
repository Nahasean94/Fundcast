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
const promisesAll = require('promise-all')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const config = require('./config')

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
const processUpload = async (upload, uploader) => {
    const id = shortid.generate()
    const {stream, filename,} = await upload
    const path = `${uploader}/${id}-${filename}`
    return await storeFS({stream}, {filename}, id, uploader).then(() =>
        queries.storeUpload(path, 'testing', uploader))
}
// const processUpload = async (upload, profile, uploader) => {
//     const id = shortid.generate()
//     const {stream, filename,} = await upload.file
//     const path = `${uploader}/${id}-${filename}`
//     return await storeFS({stream, filename}, id, uploader).then(() =>
//         queries.storeUpload(path, upload.caption, uploader))
// }
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
    return await storeFS({stream}, {filename}, id, uploader).then(() =>
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
        ethereum_address: {type: GraphQLString},
        liked_podcasts: {
            type: new GraphQLList(PodcastType),
            async resolve(parent, args) {
                return await queries.findLikedPodcasts({id: parent.id}).then(async podcasts => {
                    if (podcasts.liked_podcasts.length > 0) {
                        return await podcasts.liked_podcasts.map(async podcast => {

                            return queries.findPodcast({id: podcast})
                        })
                    }
                }).catch(err => {
                    console.log(err)
                })
            }
        }


    })
})
const TagType = new GraphQLObjectType({
    name: 'Tag',
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        timestamp: {type: GraphQLString},
        podcasts: {
            type: new GraphQLList(PodcastType),
            async resolve(parent, args) {
                return await parent.podcasts.map(async podcast => {
                    return await queries.findPodcast({id: podcast})
                })
            }
        },


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
        listens: {
            type: GraphQLInt
        },
        publishing: {type: GraphQLString},
        hosts: {
            type: new GraphQLList(PersonType),
            async resolve(parent, args) {
                return await parent.hosts.map(async host => {
                    return await queries.findUser({id: host})
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
                    if(podcastFile){
                    const {audioFile} = podcastFile
                    return await queries.findUpload({id: audioFile})
                    }
                })

            }
        },
        coverImage: {
            type: UploadType,
            async resolve(parent, args) {
                return await queries.findPodcastCoverImage(parent).then(async podcastCoverImage => {
                    if(podcastCoverImage){

                    const {coverImage} = podcastCoverImage
                    return await queries.findUpload({id: coverImage})
                    }
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
const PasswordType = new GraphQLObjectType({
    name: 'Password',
    fields: () => ({
        confirmed: {
            type: GraphQLBoolean,
        },
    })
})
const isUserExistsType = new GraphQLObjectType({
    name: 'isUserExists',
    fields: () => ({
        exists: {type: GraphQLBoolean},
    })
})
const UploadProfilePictureType = new GraphQLObjectType({
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
        hosts: {
            type: new GraphQLList(PersonType),
            resolve() {
                return queries.findAllHosts()
            }
        },
        tags: {
            type: new GraphQLList(TagType),
            async resolve() {
                return await queries.findAllTags()

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
            async resolve() {
                return await queries.findPublishedPodcasts()
            }
        },
        fetchLikedPodcasts: {
            type: new GraphQLList(PodcastType),
            args: {
                id: {type: GraphQLID},
            },
            async resolve(parent, args) {
                return await queries.findLikedPodcasts({id: args.id}).then(async podcasts => {
                    if (podcasts.liked_podcasts.length > 0) {
                        return await podcasts.liked_podcasts.map(async podcast => {
                            return queries.findPodcast({id: podcast})
                        })
                    }
                }).catch(err => {
                    console.log(err)
                })
            }

        },
        fetchPodcastsByTags: {
            type: new GraphQLList(PodcastType),
            args: {id: {type: GraphQLID}},
            async resolve(parent, args) {
                return await queries.fetchPodcastsByTags({id: args.id}).then(taggedPodcasts => {
                    const {podcasts} = taggedPodcasts
                    return podcasts.map(async podcast => {
                        return await queries.findPodcast({id: podcast})
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
            type: new GraphQLList(CommentType),
            args: {podcast_id: {type: GraphQLID}},
            async resolve(parent, args) {
                return await queries.findPodcastComments(args.podcast_id)

            }
        },
        fetchHostPodcasts: {
            type: new GraphQLList(PodcastType),
            args: {id: {type: GraphQLID}},
            async resolve(parent, args, ctx) {

                return await queries.findUserPodcasts(args.id).then(async (userPodcasts) => {
                    const {podcasts} = userPodcasts
                    if (podcasts.length < 1) {

                    }
                    else {
                        return await podcasts.reverse().map(podcast => {
                            return queries.findPodcast({id: podcast})
                        })
                    }
                })
            }
        },
        confirmPassword: {
            type: PasswordType,
            args: {password: {type: GraphQLString}},
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                return await queries.getPassword(id).then(password => {
                    if (bcrypt.compareSync(args.password, password.password)) {
                        return {
                            confirmed: true,
                        }
                    }
                    return {
                        confirmed: false,
                    }
                })
            }
        },
        getHistory: {
            type: new GraphQLList(PodcastType),
            // args:{podcast_id:GraphQLInt},
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                return await queries.getHistory(id).then(async podcasts => {
                    return await podcasts.history.map(async podcast => {
                        return await queries.findPodcast({id: podcast})
                    })
                })
            }
        },
        searchPodcasts: {
            type: new GraphQLList(PodcastType),
            args:{search:{type:GraphQLString}},
            async resolve(parent, args, ctx) {
                return await queries.searchPodcasts(args.search)
            }
        },
        searchHosts: {
            type: new GraphQLList(PersonType),
            args:{search:{type:GraphQLString}},
            async resolve(parent, args, ctx) {
                return await queries.searchHosts(args.search)
            }
        },
        searchTags: {
            type: new GraphQLList(TagType),
            args:{search:{type:GraphQLString}},
            async resolve(parent, args, ctx) {
                return await queries.searchTags(args.search)
            }
        },
        searchUsers: {
            type: new GraphQLList(PersonType),
            args:{search:{type:GraphQLString}},
            async resolve(parent, args, ctx) {
                return await queries.searchUsers(args.search)
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
        changePassword: {
            type: PasswordType,
            args: {
                password: {type: GraphQLString}
            },
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                return await queries.changePassword(id, args.password).then(changed => {
                    return {confirmed: true}
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
        updateProfileBasicInfo: {
            type: PersonType,
            args: {
                id: {type: GraphQLID},
                username: {type: GraphQLString},
                email: {type: GraphQLString},
                role: {type: GraphQLString},
                ethereum_address: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async ({id}) => {
                    return await queries.updateProfileBasicInfo(id, args).then(person => {
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
            },
            async resolve(parent, args, ctx) {
                return await authentication.authenticate(ctx).then(async ({id}) => {
                    return await queries.deletePodcast(id, args.id).then(podcast => {
                        return podcast
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
                tags: {type: new GraphQLList(GraphQLString)},
                coverImage: {type: GraphQLUpload},
                podcast: {type: GraphQLUpload},
            },
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                if (id) {
                    return await promisesAll(createNewPodcast(args, id))
                }
            }
        },
        updateBasicInfo: {
            type: PodcastType,
            args: {
                id: {type: GraphQLID},
                title: {type: GraphQLString},
                description: {type: GraphQLString},
                hosts: {type: new GraphQLList(GraphQLString)},
                paid: {type: GraphQLInt},
                tags: {type: new GraphQLList(GraphQLString)},
            },
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                if (id) {
                    return await queries.updateBasicInfo(args, id)
                }


            }
        },
        addBasicInfo: {
            type: PodcastType,
            args: {
                title: {type: GraphQLString},
                description: {type: GraphQLString},
                hosts: {type: new GraphQLList(GraphQLString)},
                paid: {type: GraphQLInt},
                tags: {type: new GraphQLList(GraphQLString)},
            },
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                if (id) {
                    return await queries.addBasicInfo(args)
                }


            }
        },
        addCoverImageFile: {
            type: PodcastType,
            args: {
                id: {type: GraphQLID},
                coverImage: {type: GraphQLUpload},
            },
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                return await processUpload(args.coverImage, id).then(async upload => {
                    const {id} = upload
                    return await queries.addCoverImageFile(args, id)
                })
            }
        },
        updateCoverImageFile: {
            type: PodcastType,
            args: {
                id: {type: GraphQLID},
                coverImage: {type: GraphQLUpload},
            },
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                return await processUpload(args.coverImage, id).then(async upload => {
                    const {id} = upload
                    return await queries.updateCoverImageFile(args, id)
                })
            }
        },
        updateAudioFile: {
            type: PodcastType,
            args: {
                id: {type: GraphQLID},
                podcast: {type: GraphQLUpload},
            },
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                return await processUpload(args.podcast, id).then(async upload => {
                    const {id} = upload
                    return await queries.updateAudioFile(args, id)
                })
            }
        },
        addAudioFile: {
            type: PodcastType,
            args: {
                id: {type: GraphQLID},
                podcast: {type: GraphQLUpload},
            },
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                return await processUpload(args.podcast, id).then(async upload => {
                    const {id} = upload
                    return await queries.addAudioFile(args, id)
                })
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
        publishPodcast: {
            type: PodcastType,
            args: {
                id: {type: GraphQLID},
            },
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                return await queries.publishPodcast(args.id)
            }
        },
        unPublishPodcast: {
            type: PodcastType,
            args: {
                id: {type: GraphQLID},
            },
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                return await queries.unPublishPodcast(args.id)
            }
        },
        uploadProfilePicture: {
            type: PersonType,
            args: {
                file: {type: GraphQLUpload},
            },
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                return await processProfilePicture(args.file, id)
            }

        },
        addHistory: {
            type: PodcastType,
            args: {podcast_id: {type:GraphQLID}},
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                return queries.addHistory(args.podcast_id,id).then(async user => {
                    return await queries.addListens(args.podcast_id)
                })
            }
        },
        addListens: {
            type: PodcastType,
            args: {podcast_id: {type:GraphQLID}},
            async resolve(parent, args, ctx) {
                return await queries.addListens(args.podcast_id)
            }
        },
    },


})

module.exports = new GraphQLSchema({query: RootQuery, mutation: Mutation})