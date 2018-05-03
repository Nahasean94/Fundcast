/**
 * This file contains database queries
 */

/**     --USER--

 * unlikeComment
 *updateComment
 *getComments
 getUploads
 *removeProfilePicture
 *
 deleteComment
 *deactivateAccount
 *    --ADMIN--
 *authenticate
 * sign up
 */
"use strict"
const {Person, Group, Page, Comment, Admin, Upload, Post} = require('./schemas')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
//Connect to Mongodb
//TODO add username and password
mongoose.connect('mongodb://localhost/practice', {promiseLibrary: global.Promise})

const queries = {
    deleteAccount: async function (ctx) {
        //TODO make all the content uploaded by these people to be anonymous
        return await Person.findByIdAndRemove({_id: ctx.session.user_id}).exec()
    },
    deleteUpload: async function (ctx, upload_id) {
        return await Person.findOneAndUpdate({_id: ctx.session.user_id}, {$pull: {uploads: upload_id}}).exec().then(async function (pulled) {
            await Upload.findByIdAndRemove({_id: upload_id}).exec().then(async function (removed) {
                fs.unlink(`./public/uploads/${removed.path}`, () => {
                    //TODO notify the user that its deleted
                })
            })
        })
    },
    deletePost: async function (ctx, post_id) {
        Comment.remove({post: post_id}).exec()
        Person.findOneAndUpdate({_id: ctx.currentUser._id}, {$pull: {posts: post_id}}).exec()
        return await Post.findByIdAndRemove({_id: post_id}).exec()

    },
    storeUpload: async function (ctx, filepath) {
        return await new Upload({
            path: filepath,
            uploader: ctx.currentUser._id,
            timestamp: new Date()
        }).save()
    },
    updateProfile: async function (ctx, profile) {
        //TODO record the date profile was updated
        return await Person.findOneAndUpdate({_id: ctx.currentUser._id}, {
            first_name: profile.first_name,
            last_name: profile.last_name,
            username: profile.username,
            email: profile.email,
            // cellphone: profile.cellphone,
            birthday: profile.birthday,
            // location: profile.location
        }).exec()
    },
    storeComment: async function (ctx, comment) {
        //TODO look for a way to only receive data from one form
        return await new Comment({
            author: ctx.currentUser.id,
            body: comment.comment,
            post: comment.postId,
            timestamp: new Date()
        }).save()
    },
    updatePost: async function (post) {
        return await Post.findOneAndUpdate({
            _id: post.id
        }, {
            body: post.body,
            status: 'edited',
            timestamp: new Date()
        }, {new: true}).exec()
    },
    likeComment: async function (ctx, id) {
        //TODO provide feedback on the front end
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
    unlikePost: async function (ctx, id) {
        //TODO provide feedback on the front end
        return await Post.findOneAndUpdate({
            _id: id
        }, {
            $pull: {
                likes: {
                    liked_by: ctx.currentUser.id
                }
            }
        }, {new: true}).exec()
    },
    likePost: async function (ctx, id) {
        //TODO provide feedback on the front end
        return await Post.findOneAndUpdate({
            _id: id,
            author: {$ne: ctx.currentUser.id},
            'likes.liked_by': {$ne: ctx.currentUser.id}

        }, {
            $push: {
                likes: {
                    liked_by: ctx.currentUser.id,
                    timestamp: new Date()
                }
            }
        }, {new: true}).exec()
    },
    createNewPost: async function (author, post) {
        // const post = ctx.request.body
        // const body = post.fields.body
        // const profile = post.fields.profile
        // const upload = post.files.upload
        // // console.log(post)
        // if (body === '' && upload !== undefined) {
        //     // console.log(upload)
        //     const path = upload.path
        //     const uploader = ctx.currentUser._id
        //     const arraypath = path.split('\\')
        //     const filepath = `${uploader}/${arraypath[arraypath.length - 1]}`
        //     await queries.storeUpload(ctx, filepath).then(async function (upload) {
        //         const newPath = `./public/uploads/${filepath}`
        //         if (!fs.existsSync(`./public/uploads/${uploader}`))
        //             fs.mkdirSync(`./public/uploads/${uploader}`)
        //         fs.rename(ctx.request.body.files.upload.path, newPath)
        //         await new Post({
        //             author: ctx.currentUser.id,
        //             status: 'original',
        //             timestamp: new Date(),
        //             profile: profile,
        //             uploads: upload._id
        //
        //         }).save({new: true}).then(async function (post) {
        //             await post.populate('uploads').populate('author', 'username profile_picture').populate('profile', 'username profile_picture').execPopulate().then(async function (pos) {
        //                 ctx.status = 200
        //                 ctx.body = pos
        //                 Person.findOneAndUpdate({
        //                     _id: ctx.currentUser.id
        //                 }, {$push: {uploads: upload._id}}).exec()
        //
        //             })
        //         }).catch(function (err) {
        //             ctx.status = 500
        //             ctx.body = {errors: err}
        //         })
        //     })
        //
        // } else if (upload === undefined && body !== '') {
        //     // console.log("sdf")
        //     await new Post({
        //         body: body,
        //         author: ctx.currentUser.id,
        //         status: 'original',
        //         timestamp: new Date(),
        //         profile: profile
        //     }).save({new: true}).then(async function (post) {
        //         await post.populate('author', 'username profile_picture').populate('profile', 'username profile_picture').execPopulate().then(function (pos) {
        //             ctx.status = 200
        //             ctx.body = pos
        //             Person.findOneAndUpdate({
        //                 _id: ctx.currentUser.id
        //             }, {$push: {posts: post._id}}).exec()
        //
        //         }).catch(function (err) {
        //             ctx.status = 500
        //             ctx.body = {errors: err}
        //         })
        //     })
        // }
        // else if (upload !== undefined && body !== '') {
        //     const path = upload.path
        //     const uploader = ctx.currentUser._id
        //     const arraypath = path.split('\\')
        //     const filepath = `${uploader}/${arraypath[arraypath.length - 1]}`
        //     await storeUpload(ctx, filepath).then(async function (upload) {
        //         const newPath = `./public/uploads/${filepath}`
        //         if (!fs.existsSync(`./public/uploads/${uploader}`))
        //             fs.mkdirSync(`./public/uploads/${uploader}`)
        //         fs.rename(ctx.request.body.files.upload.path, newPath)
        //         await new Post({
        //             body: body,
        //             author: ctx.currentUser.id,
        //             status: 'original',
        //             timestamp: new Date(),
        //             profile: profile,
        //             uploads: upload._id
        //
        //         }).save({new: true}).then(async function (post) {
        //             await post.populate('uploads').populate('author', 'username profile_picture').populate('profile', 'username profile_picture').execPopulate().then(async function (pos) {
        //                 ctx.status = 200
        //                 ctx.body = pos
        //                 Person.findOneAndUpdate({
        //                     _id: ctx.currentUser.id
        //                 }, {$push: {uploads: upload._id}}).exec()
        //             })
        //         }).catch(function (err) {
        //             ctx.status = 500
        //             ctx.body = {errors: err}
        //         })
        //     })
        // }
    },
    viewTwinpal: async function (id) {
        return Person.findOne({
            '_id': id
        }).select('first_name last_name profile_picture posts').exec()
    },
    signup: async function (userInfo) {
        return await new Person({
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
            password: bcrypt.hashSync(userInfo.password, 10),
            birthday: userInfo.birthday,
            email: userInfo.email,
            username: `${userInfo.first_name} ${userInfo.last_name}`,
            profile_picture: 'default.jpg',
            date_joined: new Date()
        }).save()
    },
    findComments: async function (post_id) {
        return await Comment.find({post: post_id}).select('author body timestamp').exec()

    },
    findPosts: async function (ctx) {
        return await Post.find({
            $or: [{
                author: ctx.currentUser.id,
            },
                {
                    profile: ctx.currentUser.id
                }]
        }).populate('uploads').populate('author', 'username profile_picture').populate('profile', 'username profile_picture').limit(2).exec()

    },
    findUserPosts: async function (args) {
        return await Person.findById(args).select("posts").sort({timestamp: -1}).exec()
    },
    findUserUploads: async function (args) {
        return await Person.findById(args._id).select("uploads").sort({timestamp: -1}).exec()
    },
    fetchNewsFeed: async function (ctx) {
        return await Post.find({
            $or: [{
                author: id,
            },
                {
                    profile: id
                },]
        }).populate('uploads').populate('author', 'username profile_picture').populate('profile', 'username profile_picture').limit(2).exec()
    },

    storeProfilePicture: async function (ctx, path) {
        return Person.findOneAndUpdate({
            _id: ctx.currentUser._id
        }, {profile_picture: path}).exec()
    },
    findTwinpals: async function (args) {
        return await Person.find({
            'birthday': args.birthday
        }).where('_id').ne(args.id).exec()
    },
    findUsers: async function () {
        return await Person.find({}).exec()
    },
    findAllPosts: async function () {
        return await Post.find({}).exec()
    },
    findAllUsers: async function () {
        return await Person.find({}).exec()
    },
    findPost: async function (args) {
        return await Post.findById(args.id).exec()
    },
    findPostLikes: async function (args) {
        return await Post.findById(args._id).select('likes').exec()
    },
    findLikedPosts: async function (args) {
        return await Person.findById(args.id).select('liked_posts').exec()
    },
    findUpload: async function (args) {
        return await Upload.findById(args.id).exec()
    },
   findUser: async function (args) {
        return await Person.findById(args.id).exec()
    },
    isUserExists: async function (args) {
        return await Person.findOne({email:args.email}).exec()
    },
    findPostUploads: async function (args) {
        return await Post.findById(args._id).select('uploads').exec()
    }
}
module.exports = queries

//TODO add posts that a person writes, and ones written on their wall to be inside the post array of one's document(record)