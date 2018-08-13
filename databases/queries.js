/**
 * This file contains database queries. We use the schemas defined in the schemas to CRUD within MongoDB
 */

"use strict"
const {Person, Comment, Upload, Podcast, Tag, Admin, About, Faqs} = require('./schemas')//import various models
const mongoose = require('mongoose')//import mongoose library
const bcrypt = require('bcrypt')//import bcrypt to assist hashing passwords
//Connect to Mongodb
mongoose.connect('mongodb://localhost/fundcast', {promiseLibrary: global.Promise})
/**
 *
 * @type {{deletePodcast: (function(*, *=)), storeUpload: (function(*=, *=, *=): *), publishPodcast: (function(*=)), unPublishPodcast: (function(*=)), updateProfileBasicInfo: (function(*=, *)), storeComment: (function(*=, *): *), updateBasicInfo: (function(*)), updateCoverImageFile: (function(*, *=)), addCoverImageFile: (function(*, *=)), changePassword: (function(*=, *=)), updateAudioFile: (function(*, *=)), addAudioFile: (function(*=, *=): any), unlikePodcast: (function(*=, *=)), likePodcast: (function(*=, *=)), addHistory: (function(*=, *=)), getHistory: (function(*=)), addListens: (function(*=)), addBasicInfo: (function(*): *), addPodcastToTag: queries.addPodcastToTag, storeProfilePicture: (function(*=, *=): *), addTagNotification: queries.addTagNotification, addPodcastToHost: queries.addPodcastToHost, addHostNotification: queries.addHostNotification, signup: (function(*): *), getPassword: (function(*=)), findPublishedPodcasts: (function(): *), fetchPodcastsByTags: (function(*)), findAllHosts: (function(): *), searchHosts: (function(*=): *), searchUsers: (function(*=): *), searchPodcasts: (function(*=): *), findTag: (function(*=)), searchTags: (function(*=): *), findAllUsers: (function(): *), findPodcast: (function(*)), findPodcastLikes: (function(*)), findPodcastComments: (function(*=): *), findComment: (function(*)), findLikedPodcasts: (function(*)), findUpload: (function(*)), findUser: (function(*)), isUserExists: (function(*)), findPodcastFile: (function(*)), findPodcastCoverImage: (function(*)), findAllTags: (function(): *), findTaggedPodcasts: (function(*=)), subscribeToHost: (function(*=, *=)), unSubscribeFromHost: (function(*=, *=)), subscribeToTag: (function(*=, *=)), unSubscribeFromTag: (function(*=, *=)), getSubscribers: (function(*=)), getSubscriptions: (function(*=)), getTagSubscribers: (function(*=)), getNotifications: (function(*=)), unlockPodcast: (function(*))}}
 * //The queries object to contain all the functions that will CRUD data on the database.
 */
const queries = {
    /**No need for detailed commenting here, all functions have names that describe what they do. The functions also received named arguments when the argumetns are few, and args keyword used when they are many, to be broken down inside the function.
     * Being database operations, promises are heavily used.
     **/
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
            tags: podcast.tags,
            "payment.paid": podcast.paid,
            "payment.amount": podcast.amount,
            "payment.ethereum_address": podcast.ethereum_address
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
        console.log(podcast, "pdi")
        return await Podcast.findOneAndUpdate({
            _id: podcast.id
        }, {
            audioFile: audioFile
        }, {new: true}).exec().then(podcast => {
            console.log(podcast)
            podcast.hosts.map(host => {
                this.addPodcastToHost(podcast, host)
            })
            podcast.tags.map(tag => {
                this.addPodcastToTag(podcast, tag)
            })
            return podcast
        })
    },
    unlikePodcast: async function (unliker, id) {
        Person.findOneAndUpdate({_id: unliker}, {
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
        return await Person.findOneAndUpdate({_id: user}, {
            $addToSet: {
                history: podcast_id
            }
        }, {new: true}).exec()
    },
    getHistory: async function (user) {

        return await Person.findById(user).select('history').exec()
    },
    addListens: async function (podcast_id) {
        return await Podcast.findOneAndUpdate({_id: podcast_id}, {
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
            "payment.amount": podcast.amount,
            "payment.ethereum_address": podcast.ethereum_address
        }).save()
    },
    addPodcastToTag: async function (podcast, tag) {
        const updatedTag = await Tag.findOneAndUpdate({
            name: tag
        }, {$push: {podcasts: podcast._id}}, {upsert: true}).exec()
        updatedTag.subscribers.map(subscriber => {
            this.addTagNotification(podcast, subscriber)
        })
    },
    storeProfilePicture: async function (path, uploader) {
        return await new Upload({
            caption: 'Profile Picture',
            path: path,
            uploader: uploader,
            timestamp: new Date()
        })
    },
    addTagNotification: async function (podcast, subscriber) {
        Person.findOneAndUpdate({
            _id: subscriber,
            "notifications.podcast": {$ne: podcast._id},
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
            "notifications.podcast": {$ne: podcast._id},
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
    },
    getPassword: async function (id) {
        return await Person.findById(id).select("password").exec()
    },
    findPublishedPodcasts: async function () {
        return await Podcast.find({publishing: 'published'}).sort({timestamp: -1}).exec()
    },
    fetchPodcastsByTags: async function (args) {
        return await Tag.findById(args.id).select("podcasts").exec()
    },
    findAllHosts: async function () {
        return await Person.find({role: 'host'}).exec()
    },
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
    },
    findPodcast: async function (args) {
        return await Podcast.findById(args.id).exec()
    },
    findPodcastLikes: async function (args) {
        return await Podcast.findById(args._id).select('likes').exec()
    },
    findPodcastComments: async function (args) {
        return await Comment.find({podcast: args}).sort({timestamp: -1}).exec()
    },
    findComment: async function (args) {
        return await Comment.findById(args.id).exec()
    },
    findLikedPodcasts: async function (args) {
        return await Person.findById(args.id).select('liked_podcasts').exec()
    },
    findUpload: async function (args) {
        return await Upload.findById(args.id).exec()
    },
    findUser: async function (args) {
        return await Person.findById(args.id).exec()
    },
    isUserExists: async function (args) {
        return await Person.findOne({email: args.email}).exec()
    },
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
    unlockPodcast: async function (args) {
        return await Podcast.findByIdAndUpdate(args.podcast, {
            $push: {
                "payment.buyers": {
                    buyer: args.buyer,
                    amount: args.amount,
                    timestamp: new Date()
                }
            }
        }, {new: true}).exec()
    },
    adminExists: async function (court_station) {
        return await Admin.find({}).exec()
    },
    registerAdmin: async function (userInfo) {
        return await new Admin({
            password: bcrypt.hashSync(userInfo.password, 10),
            username: userInfo.username,
            timestamp: new Date()
        }).save()
    },
    getAbout: async function () {
        return About.findOne({}).exec()
    },
    updateAbout: async function (about) {
        return About.findOneAndUpdate({}, {about: about}, {upsert: true}).exec()
    },
    getFaqs: async function () {
        return Faqs.find({}).exec()
    },
    addFaq: async function (faq) {
        return await  new Faqs({question:faq.question,answer:faq.answer}).save()
    },
}

// queries.addAbout()
module.exports = queries
