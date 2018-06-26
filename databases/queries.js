/**
 * This file contains database queries. We use the schemas defined in the schemas to CRUD within MongoDB
 */

"use strict"
const {Person, Comment, Upload, Podcast} = require('./schemas')//import various models
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
        Comment.remove({podcast: podcast_id}).exec()
        Person.findOneAndUpdate({_id: author}, {$pull: {podcasts: podcast_id}}).exec()
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
    updateProfile: async function (id, profile) {

        return await Person.findOneAndUpdate({_id: id}, {
            username: profile.username,
            email: profile.email,

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
    updatePodcast: async function (podcast) {
        return await Podcast.findOneAndUpdate({
            _id: podcast.id
        }, {
            body: podcast.body,
            status: 'edited',
            timestamp: new Date()
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
        console.log(liker, id)
        return await Podcast.findOneAndUpdate({
            _id: id,
            author: {$ne: liker},
            'likes.liked_by': {$ne: liker}

        }, {
            $push: {
                likes: {
                    liked_by: liker,
                    timestamp: new Date()
                }
            }
        }, {new: true}).exec()
    },

    createNewPodcast: async function (author, podcast) {
        return await new Podcast({
           title: podcast.title,
            description:podcast.description,
            timestamp:podcast.timestamp,
            hosts:podcast.hosts,
            tags:podcast.tags,
            status:podcast.status,
            coverImage:podcast.coverImage,
            audioFile:podcast.audioFile,
            "payment.paid": podcast.paid
        }).save()

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
        return await Podcast.find({
            $or: [{
                author: args,
            },
                {
                    profile: args
                },]
        }).sort({timestamp: -1}).exec()
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
        }, {profile_picture: path}).exec()
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
    }
    ,
    findAllPodcasts: async function () {
        return await Podcast.find({}).sort({timestamp:-1}).exec()
    }
    ,
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
        return await Comment.find({podcast:args}).sort({timestamp:-1}).exec()
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
    }
}
module.exports = queries

//TODO add podcasts that a person writes, and ones written on their wall to be inside the podcast array of one's document(record)