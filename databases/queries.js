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

    addBasicInfo: async function (podcast) {
        return await new Podcast({
            title: podcast.title,
            description: podcast.description,
            timestamp: new Date(),
            hosts: podcast.hosts,
            tags: podcast.tags,
            "payment.paid": podcast.paid,
            "payment.amount": podcast.amount
        }).save().then(podcast => {
            podcast.hosts.map( host => {
                this.addPodcastToHost(podcast, host)
            })
            podcast.tags.map( tag => {
                this.addPodcastToTag(podcast, tag)
            })
            return podcast
        })
    },
    addPodcastToTag: async function (podcast, tag) {
        const updatedTag = await Tag.findOneAndUpdate({
            name: tag
        }, {$push: {podcasts: podcast._id}}, {upsert: true}).exec()
        updatedTag.subscribers.map(subscriber => {
            this.addTagNotification(podcast, subscriber)
        })
    },
    addTagNotification: async function (podcast, subscriber) {
        Person.findOneAndUpdate({
            _id: subscriber,
            "notifications.podcast":{$ne:  podcast._id},
        }, {
            $addToSet: {
                notifications: {
                    podcast: podcast._id,
                    category: 'tags',
                    read: false,
                    timestamp: new Date()
                }
            }
        }).exec()
    },
    addPodcastToHost: async function (podcast, host) {
        const updatedHost = await Person.findOneAndUpdate({
            _id: host
        }, {$push: {podcasts: podcast._id}}, {new: true}).exec()
        updatedHost.subscribers.map(subscriber => {
            this.addHostNotification(podcast, subscriber)
        })
    },
    addHostNotification: async function (podcast, subscriber) {
        Person.findOneAndUpdate({
            _id: subscriber,
           "notifications.podcast" :{$ne:  podcast._id},
        }, {
            $addToSet: {
                notifications: {
                    podcast: podcast._id,
                    category: 'host',
                    read: false,
                    timestamp: new Date()
                }
            }
        }).exec()
    },
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
    }
    ,
    searchHosts: async function (search) {
        return await Person.find(
            {username: {"$regex": search, "$options": "i"}, role: "host"},
        ).exec()
    },
    searchUsers: async function (search) {
        return await Person.find(
            {username: {"$regex": search, "$options": "i"}, role: "listener"},
        ).exec()
    },
    searchPodcasts: async function (search) {
        return await Podcast.find(
            {
                $or: [
                    {
                        title: {"$regex": search, "$options": "i"}
                    },
                    {
                        description: {"$regex": search, "$options": "i"}
                    }],

                publishing: 'published'

            }
        ).exec()
    },
    findTag: async function (tag) {
        return await Tag.findById(tag).exec()
    },
    searchTags: async function (search) {
        return await Tag.find(
            {
                name: {"$regex": search, "$options": "i"}
            },
        ).exec()
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
    },
    subscribeToHost: async function (host, subscriber) {
        const subscribed = await Person.findByIdAndUpdate(host, {$addToSet: {subscribers: subscriber}}, {new: true}).exec()
        Person.findByIdAndUpdate(subscriber, {$addToSet: {"subscriptions.hosts": host}}, {new: true}).exec()
        return subscribed
    },
    unSubscribeFromHost: async function (host, subscriber) {
        const subscribed = await Person.findByIdAndUpdate(host, {$pull: {subscribers: subscriber}}, {new: true}).exec()
        Person.findByIdAndUpdate(subscriber, {$pull: {"subscriptions.hosts": host}}, {new: true}).exec()
        return subscribed
    },
    subscribeToTag: async function (tag, subscriber) {
        const subscribed = await Tag.findByIdAndUpdate(tag, {$addToSet: {subscribers: subscriber}}, {new: true}).exec()
        Person.findByIdAndUpdate(subscriber, {$addToSet: {"subscriptions.tags": tag}}, {new: true}).exec()
        return subscribed
    },
    unSubscribeFromTag: async function (tag, subscriber) {
        const subscribed = await Tag.findByIdAndUpdate(tag, {$pull: {subscribers: subscriber}}, {new: true}).exec()
        Person.findByIdAndUpdate(subscriber, {$pull: {"subscriptions.tags": tag}}, {new: true}).exec()
        return subscribed
    },
    getSubscribers: async function (host) {
        return await Person.findById(host).select("subscribers").exec()
    },
    getSubscriptions: async function (id) {
        return await Person.findById(id).select("subscriptions").exec()
    },
    getTagSubscribers: async function (tag) {
        return await Tag.findById(tag).exec()
    },
    getNotifications: async function (id) {
        return await Person.findById(id).select('notifications').exec()
    },
}
module.exports = queries

//TODO add podcasts that a person writes, and ones written on their wall to be inside the podcast array of one's document(record)