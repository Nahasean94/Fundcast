/**
 * This file contains database queries. We use the schemas defined in the schemas to CRUD within MongoDB
 */

"use strict"
const {Person, Comment, Upload, Podcast, Tag} = require('./schemas')//import various models
const mongoose = require('mongoose')//import mongoose library
const bcrypt = require('bcrypt')//import bcrypt to assist hashing passwords
//Connect to Mongodb

mongoose.connect('mongodb://localhost/fundcast', {promiseLibrary: global.Promise})

const queries = {
    // deleteAccount: async function (ctx) {
    //     //TODO make all the content uploaded by these people to be anonymous
    //     return await Person.findByIdAndRemove({_id: ctx.session.user_id}).exec()
    // },
    // deleteUpload: async function (ctx, upload_id) {
    //     return await Person.findOneAndUpdate({_id: ctx.session.user_id}, {$pull: {uploads: upload_id}}).exec().then(async function (pulled) {
    //         await Upload.findByIdAndRemove({_id: upload_id}).exec().then(async function (removed) {
    //             fs.unlink(`./public/uploads/${removed.path}`, () => {
    //                 //TODO notify the user that its deleted
    //             })
    //         })
    //     })
    // },
    deletePodcast: async function (author, podcast_id) {
        Podcast.findById(podcast_id).then(podcast => {
            podcast.hosts.map(host => {
                Person.findOneAndUpdate({_id: host}, {$pull: {podcasts: podcast_id}}).exec()

            })
        })
        Comment.remove({podcast: podcast_id}).exec()
        return await Podcast.findByIdAndRemove({_id: podcast_id}).exec()

    },
    storeUpload: async function (path, caption, uploader) {
        return await new Upload({
            path: path,
            uploader: uploader,
            timestamp: new Date(),
            caption: caption,
        }).save()
    },
    publishPodcast: async function (id) {
        return await Podcast.findOneAndUpdate({
            _id: id
        }, {publishing: 'published'}, {new: true}).exec()
    },
    unPublishPodcast: async function (id) {
        return await Podcast.findOneAndUpdate({
            _id: id
        }, {publishing: 'unpublished'}, {new: true}).exec()
    },
    updateProfileBasicInfo: async function (id, profile) {

        return await Person.findOneAndUpdate({_id: id}, {
            username: profile.username,
            email: profile.email,
            role: profile.role,
            ethereum_address: profile.ethereum_address,

        }).exec()
    },
    storeComment: async function (author, comment) {
        return await new Comment({
            author: author,
            body: comment.comment,
            podcast: comment.podcast_id,
            timestamp: new Date()
        }).save()
    },
    updateBasicInfo: async function (podcast) {
        return await Podcast.findOneAndUpdate({
            _id: podcast.id
        }, {
            title: podcast.title,
            description: podcast.description,
            timestamp: new Date(),
            hosts: podcast.hosts,
            'payment.paid': podcast.paid,
            tags: podcast.tags
        }, {new: true}).exec()
    },
    updateCoverImageFile: async function (podcast, coverImage) {
        return await Podcast.findOneAndUpdate({
            _id: podcast.id
        }, {
            coverImage: coverImage
        }, {new: true}).exec()
    },
    addCoverImageFile: async function (podcast, coverImage) {
        return await Podcast.findOneAndUpdate({
            _id: podcast.id
        }, {
            coverImage: coverImage
        }, {new: true}).exec()
    },
    changePassword: async function (id, password) {
        return await Person.findOneAndUpdate({
            _id: id
        }, {
            password: bcrypt.hashSync(password, 10),
        }, {new: true}).exec()
    },
    updateAudioFile: async function (podcast, audioFile) {
        return await Podcast.findOneAndUpdate({
            _id: podcast.id
        }, {
            audioFile: audioFile
        }, {new: true}).exec()
    },
    addAudioFile: async function (podcast, audioFile) {
        return await Podcast.findOneAndUpdate({
            _id: podcast.id
        }, {
            audioFile: audioFile
        }, {new: true}).exec()
    },
    likeComment: async function (ctx, id) {
        return await Comment.findOneAndUpdate({
            _id: id,
            author: {$ne: ctx.currentUser.id},
            'likes.liked_by': {$ne: ctx.currentUser.id}

        }, {
            $push: {
                likes: {
                    liked_by: ctx.currentUser.id
                }
            }
        }, {new: true}).exec()
    },
    unlikePodcast: async function (unliker, id) {
        Person.findOneAndUpdate({_id: liker}, {
            $pull: {
                liked_podcasts: id
            }
        }, {new: true}).exec()
        return await Podcast.findOneAndUpdate({
            _id: id
        }, {
            $pull: {
                likes: {
                    liked_by: unliker
                }
            }
        }, {new: true}).exec()
    },
    likePodcast: async function (liker, id) {
        Person.findOneAndUpdate({_id: liker}, {
            $push: {
                liked_podcasts: id
            }
        }, {new: true}).exec()
        return await Podcast.findOneAndUpdate({
            _id: id,
            author: {$ne: liker}
        }, {
            $push: {
                likes: {
                    liked_by: liker,
                    timestamp: new Date()
                }
            }
        }, {new: true}).exec()
    },
    addHistory: async function (podcast_id, user) {
        return await  Person.findOneAndUpdate({_id: user}, {
            $addToSet: {
                history: podcast_id
            }
        }, {new: true}).exec()
    },
    getHistory: async function (user) {

        return await  Person.findById(user).select('history').exec()
    },

    addListens: async function (podcast_id) {
        return await  Podcast.findOneAndUpdate({_id: podcast_id}, {
            $inc: {
                listens: 1
            }
        }, {new: true}).exec()
    },

    addBasicInfo: async function ( podcast) {
        return await new Podcast({
            title: podcast.title,
            description: podcast.description,
            timestamp: new Date(),
            hosts: podcast.hosts,
            tags: podcast.tags,
            "payment.paid": podcast.paid
        }).save().then(  podcast => {
             podcast.hosts.map(host => {
                Person.findOneAndUpdate({
                    _id: host
                }, {$push: {podcasts: podcast._id}}).exec()
            })
             podcast.tags.map(tag => {
                Tag.findOneAndUpdate({
                    name: tag
                }, {$push: {podcasts: podcast._id}}, {upsert: true}).exec()
            })
        return podcast
        })

    },
    // saveUploads: async function (path, profile, uploader) {
    //     return await this.storeUpload(path, uploader).then(async upload => {
    //         //create a new podcast of the uploaded file
    //       return await new Podcast({
    //             body: '',
    //             author: uploader,
    //             status: 'original',
    //             timestamp: new Date(),
    //             profile: profile,
    //             uploads: upload._id
    //
    //         }).save()
    //
    //         return podcast
    //     })
    // },
    viewTwinpal: async function (id) {
        return Person.findOne({
            '_id': id
        }).select('first_name last_name profile_picture podcasts').exec()
    }
    ,
    signup: async function (userInfo) {
        return await new Person({
            password: bcrypt.hashSync(userInfo.password, 10),
            email: userInfo.email,
            username: userInfo.username,
            role: userInfo.role,
            profile_picture: 'default.jpg',
            date_joined: new Date()
        }).save()
    }
    ,
// findComments: async function (podcast_id) {
//     return await Comment.find({podcast: podcast_id}).select('author body timestamp').exec()
//
// },
    findPodcasts: async function (ctx) {
        return await Podcast.find({
            $or: [{
                author: ctx.currentUser.id,
            },
                {
                    profile: ctx.currentUser.id
                }]
        }).populate('uploads').populate('author', 'username profile_picture').populate('profile', 'username profile_picture').limit(2).exec()
    },
    findUserPodcasts: async function (args) {
        // return await Person.findById(args).select("podcasts").sort({timestamp: -1}).exec()
        return await Person.findById(args).select("podcasts").exec()
    }
    ,
    findUserUploads: async function (args) {
        return await Person.findById(args._id).select("uploads").sort({timestamp: -1}).exec()
    }

    ,
    fetchNewsFeed: async function (ctx) {
        return await Podcast.find({
            $or: [{
                author: id,
            },
                {
                    profile: id
                },]
        }).populate('uploads').populate('author', 'username profile_picture').populate('profile', 'username profile_picture').limit(2).exec()
    }
    ,

    storeProfilePicture: async function (path, uploader) {
        return await Person.findOneAndUpdate({
            _id: uploader,
        }, {profile_picture: path}, {new: true}).exec()
    }
    ,
    findTwinpals: async function (args) {
        return await Person.find({
            'birthday': args.birthday
        }).where('_id').ne(args.id).exec()
    }
    ,
    findUsers: async function () {
        return await Person.find({}).exec()
    },
    getPassword: async function (id) {
        return await Person.findById(id).select("password").exec()
    }
    ,
    findAllPodcasts: async function () {
        return await Podcast.find({}).sort({timestamp: -1}).exec()
    },
    findPublishedPodcasts: async function () {
        return await Podcast.find({publishing: 'published'}).sort({timestamp: -1}).exec()
    },
    fetchPodcastsByTags: async function (args) {
        return await Tag.findById(args.id).select("podcasts").exec()
    }
    ,
    findAllHosts: async function () {
        return await Person.find({role: 'host'}).exec()
    },
    searchHosts: async function (username) {
        return await Person.find(
            {username: {"$regex": username, "$options": "i"}, role: "host"},
        )
    },

    findAllUsers: async function () {
        return await Person.find({}).exec()
    }
    ,
    findPodcast: async function (args) {
        return await Podcast.findById(args.id).exec()
    }
    ,
    findPodcastLikes: async function (args) {
        return await Podcast.findById(args._id).select('likes').exec()
    }
    ,
    findPodcastComments: async function (args) {
        return await Comment.find({podcast: args}).sort({timestamp: -1}).exec()
    }
    ,
    findComment: async function (args) {
        return await Comment.findById(args.id).exec()
    }
    ,
    findLikedPodcasts: async function (args) {
        return await Person.findById(args.id).select('liked_podcasts').exec()
    }
    ,
    findUpload: async function (args) {
        return await Upload.findById(args.id).exec()
    }
    ,
    findUser: async function (args) {
        return await Person.findById(args.id).exec()
    }
    ,
    isUserExists: async function (args) {
        return await Person.findOne({email: args.email}).exec()
    }
    ,
    findPodcastFile: async function (args) {
        return await Podcast.findById(args._id).select('audioFile').exec()
    },
    findPodcastCoverImage: async function (args) {
        return await Podcast.findById(args._id).select('coverImage').exec()
    },
    findAllTags: async function () {
        return await Tag.find({}).exec()
    },
    findTaggedPodcasts: async function (tag_id) {
        return await Tag.findById(tag_id).select("podcasts").exec()
    }
}
module.exports = queries

//TODO add podcasts that a person writes, and ones written on their wall to be inside the podcast array of one's document(record)