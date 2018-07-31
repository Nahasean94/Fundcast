'use strict'

/**
 *
 * This file contains the schemas (tables) that will be used to store various data
 */
//import the mongoose library to help us create javascript objects which are used to define schemas and also hold various data types
const mongoose = require('mongoose')

/**
 *
 * In mongoose, a schema represents the structure of a particular document, either completely or just a portion of the document. It's a way to express expected properties and values as well as constraints and indexes. A model defines a programming interface for interacting with the database (read, insert, update, etc). So a schema answers "what will the data in this collection look like?" and a model provides functionality like "Are there any records matching this query?" or "Add a new document to the collection".

 In straight RDBMS, the schema is implemented by DDL statements (create table, alter table, etc), whereas there's no direct concept of a model, just SQL statements that can do highly flexible queries (select statements) as well as basic insert, update, delete operations.

 Another way to think of it is the nature of SQL allows you to define a "model" for each query by selecting only particular fields as well as joining records from related tables together.

 *
 */
//declare the Schema object. Each Schema object represents the equivalent of table in mysql
const Schema = mongoose.Schema

//create the Person Schema (Person table)
const PersonSchema = new Schema({
    username: String,
    email: {
        type: String,
        unique: [true, "email already exists"],
        required: [true, 'Email is a required field']
    },
    password: {
        type: String,
        required: [true, 'Password is a required field']
    },
    profile_picture: String,
    ethereum_address: String,//ethereum address
    role: {
        type: String,
        required: [true, "role is required"],
        enum: ["system", "host", "listener"]
    },
    date_joined: Date,
    podcasts: [{
        type: Schema.Types.ObjectId,
        ref: 'Podcast'
    }],
    liked_podcasts: [{
        type: Schema.Types.ObjectId,
        ref: 'Podcast'
    }],
    history: [{
        type: Schema.Types.ObjectId,
        ref: 'Podcast',
    }],
    subscriptions: {
        hosts: [{
            type: Schema.Types.ObjectId,
            ref: 'Podcast'
        }],
        tags: [{
            type: Schema.Types.ObjectId,
            ref: 'Podcast'
        }],
    },
    subscribers: [{
        type: Schema.Types.ObjectId,
        ref: 'Person'
    }],
    notifications: [{
        podcast: {
            type: Schema.Types.ObjectId,
            ref: 'Podcast',
            // unique:[true,'podcast already exists'],
            required: [true, 'podcast is a required field']
        },
        category: {
            type: String,
            enum: ['tags', 'host'],
            required: [true, 'category is a required field']
        },
        read: {
            type: Boolean,
            default: false,
        },
        timestamp: Date
    }]
})
//create the Podcasts Schema (Podcasts table)
const PodcastSchema = new Schema({
    title: {
        type: String,
        required: [true, "Podcast title is required"]
    },
    description: String,
    timestamp: Date,
    listens: {
        type: Number,
        default: 0,
    },
    hosts: [{
        type: Schema.Types.ObjectId,
        ref: 'Person'
    }],
    likes: [{
        liked_by: {
            type: Schema.Types.ObjectId,
            ref: 'Person'
        },
        timestamp: Date,
    }],
    tags: [{
        type: String,
    }],
    status: {
        type: String,
        enum:
            ['original', 'edited'],
        default: 'original'
    },
    publishing: {
        type: String,
        enum:
            ['published', 'unpublished'],
        default: 'published'
    },
    coverImage: {
        type: Schema.Types.ObjectId,
        ref: 'Upload',

    },
    audioFile: {
        type: Schema.Types.ObjectId,
        ref: 'Upload',

    },
    payment: {
        paid: {
            type: Number,
            required: [true, "paid is required. (either 'true' or 'false')"]
        },
        amount: Number,
        ethereum_address: String,
        buyers: [{
            buyer: {
                type: Schema.Types.ObjectId,
                ref: 'Person'
            },
            timestamp: Date,
            amount: Number,
        }]
    }
})
//create the Uploads Schema (Uploads table)
const UploadSchema = new Schema({
    caption: {
        type: String,
        required: [true, "caption is a required field"]
    },
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
//create the Tags Schema (Tags table)
const TagSchema = new Schema({
    name: {
        type: String,
        required: [true, "name is a required field"]
    },

    podcasts: [{
        type: Schema.Types.ObjectId,
        ref: 'Podcast',
        required: [true, 'creating a new tag requires at least one podcast']
    }],
    timestamp: {
        type: Date,
    },
    subscribers: [{
        type: Schema.Types.ObjectId,
        ref: 'Person'
    }],
})
//create the Comments Schema (Comments table)
const CommentSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'Person'
    },
    body: {
        type: String,
        required: [true, 'Tell others about your new post']
    },
    podcast: {
        type: Schema.Types.ObjectId,
        ref: 'Podcast',
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
            person: {
                type: Schema.Types.ObjectId,
                ref: 'Person'
            },
            timestamp: Date,
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

/**
 *
 * Create models from the above schemas.
 */
const Person = mongoose.model('Person', PersonSchema)
const Comment = mongoose.model('Comment', CommentSchema)
const Podcast = mongoose.model('Podcast', PodcastSchema)
const Tag = mongoose.model('Tag', TagSchema)
const Upload = mongoose.model('Upload', UploadSchema)
//export the above models to used in other files
module.exports = {
    Person, Comment, Upload, Podcast, Tag
}