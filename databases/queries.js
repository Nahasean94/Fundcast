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
    deletePost: async function (author, post_id) {
        Comment.remove({post: post_id}).exec()
        Person.findOneAndUpdate({_id: author}, {$pull: {posts: post_id}}).exec()
        return await Post.findByIdAndRemove({_id: post_id}).exec()

    },
    storeUpload: async function (path, uploader) {
        return await new Upload({
            path: path,
            uploader: uploader,
            timestamp: new Date()
        }).save()
    },
    updateProfile: async function (id, profile) {
        //TODO record the date profile was updated
        return await Person.findOneAndUpdate({_id: id}, {
            first_name: profile.first_name,
            last_name: profile.last_name,
            username: profile.username,
            email: profile.email,
            // cellphone: profile.cellphone,
            birthday: profile.birthday,
            // location: profile.location
        }).exec()
    },
    storeComment: async function (author, comment) {
        //TODO look for a way to only receive data from one form

        return await new Comment({
            author: author,
            body: comment.comment,
            post: comment.post_id,
            timestamp: new Date()
        }).save().then(savedComment => {
            return Post.findOneAndUpdate({_id: comment.post_id}, {
                $push: {
                    comments: savedComment._id
                }
            }, {new: true}).exec()
        })
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
    unlikePost: async function (unliker, id) {
        //TODO provide feedback on the front end
        return await Post.findOneAndUpdate({
            _id: id
        }, {
            $pull: {
                likes: {
                    liked_by: unliker
                }
            }
        }, {new: true}).exec()
    },
    likePost: async function (liker, id) {
        //TODO provide feedback on the front end
        console.log(liker, id)
        return await Post.findOneAndUpdate({
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
    createNewPost: async function (author, post) {

        const body = post.body
        const profile = post.profile

        if (body !== '') {
            return await new Post({
                body: body,
                author: author,
                status: 'original',
                timestamp: new Date(),
                profile: profile
            }).save({new: true}).then(async function (post) {
                Person.findOneAndUpdate({
                    _id: author
                }, {$push: {posts: post._id}}).exec()
                return post
            }).catch(function (err) {
                console.log(err)
            })
        }
    },
    saveUploads: async function (path, profile, uploader) {
        return await this.storeUpload(path, uploader).then(async upload => {
            //add the upload to the uploader's document
            Person.findOneAndUpdate({
                _id: uploader
            }, {$push: {uploads: upload._id}}).exec()
            //create a new post of the uploaded file
            const post = await new Post({
                body: '',
                author: uploader,
                status: 'original',
                timestamp: new Date(),
                profile: profile,
                uploads: upload._id

            }).save()
            Person.findOneAndUpdate({
                _id: uploader
            }, {$push: {posts: post._id}}).exec()
            return post
        })
    },
    viewTwinpal: async function (id) {
        return Person.findOne({
            '_id': id
        }).select('first_name last_name profile_picture posts').exec()
    }
    ,
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
    }
    ,
// findComments: async function (post_id) {
//     return await Comment.find({post: post_id}).select('author body timestamp').exec()
//
// },
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
        // return await Person.findById(args).select("posts").sort({timestamp: -1}).exec()
        return await Post.find({
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
        return await Post.find({
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
    findAllPosts: async function () {
        return await Post.find({}).exec()
    }
    ,
    findAllUsers: async function () {
        return await Person.find({}).exec()
    }
    ,
    findPost: async function (args) {
        return await Post.findById(args.id).exec()
    }
    ,
    findPostLikes: async function (args) {
        return await Post.findById(args._id).select('likes').exec()
    }
    ,
    findPostComments: async function (args) {
        return await Post.findById(args._id).select('comments').exec()
    }
    ,
    findComment: async function (args) {
        return await Comment.findById(args.id).exec()
    }
    ,
    findLikedPosts: async function (args) {
        return await Person.findById(args.id).select('liked_posts').exec()
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
    findPostUploads: async function (args) {
        return await Post.findById(args._id).select('uploads').exec()
    }
}
module.exports = queries

//TODO add posts that a person writes, and ones written on their wall to be inside the post array of one's document(record)