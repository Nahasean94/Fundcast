'use strict'
const mongoose = require('mongoose')
//TODO add validation
const Schema = mongoose.Schema
//TODO apparently, mongodb ignores any fields that are not filled. Use some validation to autopopulate these details and give a default value.
const PersonSchema = new Schema({
    first_name: String,
    last_name: String,
    username: String,
    email: {
        type: String,
        unique:[true,"email already exists"],
        required: [true, 'Email is a required field']
    },
    cellphone: {
        type: Number,
        default: 0
    },
    password: {
        type: String,
        required: [true, 'Password is a required field']
    },
    birthday: {
        type: Date,
        required: [true, 'Date of birth is a required field']
    },
    twinpals: [{
        type: Schema.Types.ObjectId,
        ref: 'Person',
        date_twinpalled: {type: Date}

    }],
    profile_picture: String,
    twinpal_requests: [{
        from: {
            type: Schema.Types.ObjectId,
            ref: 'Person'
        },
        timestamp: {
            type: Date
        }
    }],
    location: {
        type: String,
        default: ''
    },
    groups_member: [{
        type: Schema.Types.ObjectId,
        ref: 'Group'
    }],
    groups_admin: [{
        type: Schema.Types.ObjectId,
        ref: 'Group'
    }],
    pages_liked: [{
        type: Schema.Types.ObjectId,
        ref: 'Page'
    }],
    posts: [{type: Schema.Types.ObjectId, ref: 'Posts'}],
    date_joined: {
        type: Date,

    },
    uploads: [{
        type: Schema.Types.ObjectId,
        ref: 'Upload'
    }],
    shares: [{
        post: {
            type: Schema.Types.ObjectId,
            ref: 'Person.posts'
        }
    }],
    liked_posts: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }]
})
const PostSchema = new Schema({
    body: {
        type: String,
    },
    timestamp: {
        type: Date
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'Person'
    },

    //TODO show a count of all likes,views,etc when shared. Keep a link to the original poster
    likes:
        [{
            liked_by: {
                type: Schema.Types.ObjectId,
                ref: 'Person'
            },
            timestamp: {
                type: Date,
                //TODO make all timestamps required
            }
        }],
    //TODO you must like a post before sharing it
    shares:
        [
            {
                shared_by: {
                    type: Schema.Types.ObjectId,
                    ref: 'Person'
                },
                timestamp: {
                    date: Date,
                }
            }],
    scope:
        {
            type: String,
            enum:
                ['twinpals', 'public', 'private', 'followers', 'following'],
            default:
                'public'
        }
    ,
//TODO add conditional presave and post saved to track edit history
    status: {
        type: String,
        enum:
            ['original', 'edited', 'deleted']
    },
//TODO look for a way to reference a sub document within another sub document of the same parent
    uploads: [{
        type: Schema.Types.ObjectId,
        ref: 'Upload'
    }],
    profile:{
        type:Schema.Types.Object,
        ref:'Person',
        required:[true,'Profile is a required field']
    }
})
const UploadSchema = new Schema({
    path: {
        type: String,
        unique: true,
        required: [true, 'Path is required']
    },
    uploader: {
        type: Schema.Types.ObjectId,
        ref: 'Person',
        required: [true, 'Who is the uploader?']
    },
    timestamp: {
        type: Date,
    }
})
const GroupSchema = new Schema({
    name: String,
    // members:[ObjectID],
    // admin:[ObjectID],
})
const AdminSchema = new Schema({
    //TODO Restrict admins to devices,networks, logged in only in one device etc
    email: {
        type: String,
        unique: true,
        required: [true, 'Email is required']
    },
    email2: {
        type: String,
        unique: true,
        required: [true, 'Email 2 is required']
    },
    cellphone: {
        type: Number,
        unique: true,
        required: [true, 'Phone number is required']
    },
    username: {
        type: String,
        required: [true, 'Username is required']
    },
    password: {
        type: String,
        required: [true, 'Email is required']
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: ['system']
    },
    date_assigned: {
        type: Date,
    }
})
const PageSchema = new Schema({
    name: String,
    timestamp: String,
    likes: [{
        // fan:ObjectID,
        timestamp: Date
    }]
})
const CommentSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'Person'
    },
    body: {
        type: String,
        required: [true, 'Tell others about your new post']
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
    },
    replies: [{
        author: {
            type: Schema.Types.ObjectId,
            ref: 'Person'
        },
        body: {
            type: String,
            required: [true, 'Tell others about your new post']
        },
        timestamp: {
            type: Date,

        },
        likes: [{
            type: Schema.Types.ObjectId,
            ref: 'Person'
        }]
    }],
    timestamp: {
        type: Date,
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'Person'
    }]
})

const Person = mongoose.model('Person', PersonSchema)
// const Post = mongoose.model('Post', PostSchema)
// const FriendRequest = mongoose.model('FriendRequest', FriendRequestSchema)
const Group = mongoose.model('Group', GroupSchema)
const Page = mongoose.model('Page', PageSchema)
const Comment = mongoose.model('Comment', CommentSchema)
const Admin = mongoose.model('Admin', AdminSchema)
const Post = mongoose.model('Post', PostSchema)
const Upload = mongoose.model('Upload', UploadSchema)
module.exports = {
    Person, Group, Page, Comment, Admin, Upload, Post
}