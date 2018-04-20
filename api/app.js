'use strict'

/**
 * Declare and initialize all variables need in this codebase
 */
const Koa = require('koa')
const Router = require('koa-router')
const Pug = require('koa-pug')
const session = require('koa-session')
const mongoose = require('mongoose')
const KoaBody = require('koa-body')
const cors = require('koa2-cors')
const fs = require('fs')
const jwt = require('jsonwebtoken')
const config = require('./config')
const Validator = require('validator')
const isEmpty = require('lodash/isEmpty')
const bcrypt = require('bcrypt')
const {authenticate} = require('./middleware/authenticate')
const queries = require('./../databases/queries')
// const serve=require('koa-static')
const {Person, Group, Page, Comment, Admin, Upload, Post} = require('../databases/schemas')
const koaBody = new KoaBody({
    multipart: true,
    formidable: {uploadDir: './public/uploads', keepExtensions: true}
})

const router = new Router()
const app = new Koa()

app.keys = ['some secret hurr']

const CONFIG = {
    key: 'koa:sess',
    maxAge: 86400000,
    overwrite: true,
    httpOnly: true,
    signed: true,
    rolling: false
}
//Connect to Mongodb
mongoose.connect('mongodb://localhost/practice', {useMongoClient: true, promiseLibrary: global.Promise})
const pug = new Pug({
    viewPath: './public'
})
// app.use(serve({rootDir:'public'}))
router.get('/', async ctx => {
    ctx.render('index')
})
router.get('/profile', authenticate, async ctx => {
    delete ctx.currentUser.password
    ctx.body = ctx.currentUser

})

/**
 * Handles the login post request to check whether the user is registered.
 */
router.post('/login', koaBody, async ctx => {
    const {email, password} = ctx.request.body
    // const password_digest = bcrypt.hashSync(password, 10)
    await Person.findOne({email: email}).select('_id email username birthday password').exec().then(function (person) {
        if (person) {
            if (bcrypt.compareSync(password, person.password)) {
                ctx.body = {
                    token: jwt.sign({
                        id: person._id,
                        email: person.email,
                        username: person.username,
                        birthday: person.birthday
                    }, config.jwtSecret)
                }
            }
            else {
                ctx.status = 401
                ctx.body = {errors: {form: 'No user with such credentials exists.'}}
            }
        } else {
            ctx.status = 401
            ctx.body = {errors: {form: 'No user with such credentials exists.'}}
        }
    }).catch(function (err) {
        ctx.status = 400
        ctx.body = {errors: {form: err}}
    })
})
router.get('/logout', async ctx => {
    //Clear the session
    ctx.session = null
    ctx.redirect('/')
})

router.get('/users/:email', async ctx => {
    return await Person.findOne({email: ctx.params.email}).exec().then(function (user) {
        ctx.body = user
    })
})
router.get('/posts/get_comments/:id', async ctx => {
    //TODO look for a way to fetch author's username
    await findComments(ctx.params.id).then(async function (comments) {
        // for (let i = 0; i < comments.length; i++) {
        //     comments[i].author_name =  Person.findOne({_id: comments[i].author}).select('username').exec()
        // }
        ctx.render('get_comments', {comments: comments})
    })
})

//fetch all the comments of a certain post
async function findComments(post_id) {
    return await Comment.find({post: post_id}).select('author body timestamp').exec()

}

//find posts created by the logged in user
async function findPosts(author) {
    return await Post.find({
        author: author
    }).sort({timestamp: 'descending'}).exec()
}

//fetch posts

router.get('/posts', authenticate, async ctx => {
    await queries.findPosts(ctx).then(function (posts) {
        // console.log(posts)
        if (!posts) {
            ctx.status = 404
            ctx.body = {error: 'No such post'}
        }
        else {
            ctx.status = 200
            ctx.body = posts
        }
    })
        .catch(function (err) {
            ctx.status = 500
            ctx.body = {error: err}

        })

})
router.get('/posts/:id', authenticate, async ctx => {
    await queries.findUserPosts(ctx.params.id)
        .then(async function (posts) {
            if (!posts) {
                ctx.status = 404
                ctx.body = {error: 'No such post'}
            }
            else {
                ctx.status = 200
                ctx.body = posts
            }
        })
        .catch(function (err) {
            ctx.status = 500
            ctx.body = {error: err}

        })
})
router.get('/newsfeed', authenticate, async ctx => {
    let allPosts =[]
    ctx.body = await queries.findTwinpals(ctx).then(async function (twinpals) {
        twinpals.push({_id: ctx.currentUser._id})
                    for (let i = 0; i < twinpals.length; i++) {
                        await queries.findUserPosts(twinpals[i]._id).then(function (posts) {
                            if (posts.length < 1) {
                                // console.log(twinpals[i])
                            }
                            else {
                                //posts come as an array, we need to pick each element of the array and push it to allPosts. When we use ES6, the spread operator will suffice.
                                for (let j = posts.length-1; j >=0 ; j--) {
                                    allPosts.push(posts[j])
                                }
                            }
                        }).catch(function (err) {
                            console.log(err)
                        })
                    }
                    return allPosts
        }).catch(function (err) {
            ctx.status = 500
            ctx.body = {error: err}
        })


})
/**
 * Handle the changing of profile picture
 */

router.post('/profile_pic', koaBody, authenticate, async ctx => {
    //rename the file with what the user keyed in
    const upload = ctx.request.body
    const pic = upload.files.profile_picture
    if (pic !== undefined) {
        console.log("profiling")
        const path = pic.path
        const uploader = ctx.currentUser._id
        const arraypath = path.split('\\')
        const filepath = `${uploader}/${arraypath[arraypath.length - 1]}`
        await storeProfilePicture(ctx, filepath).then(async function (response) {
            const newPath = `./public/uploads/${filepath}`
            ctx.status = 200
            ctx.body = 'profile picture successfully saved'
            if (!fs.existsSync(`./public/uploads/${uploader}`))
                fs.mkdirSync(`./public/uploads/${uploader}`)
            fs.rename(pic.path, newPath)

        }).catch(function (err) {
            ctx.status = 500
            ctx.body = err
        })
    }
})

/**
 *
 * @param ctx
 * @param path
 * @returns {Promise.<void>}
 */
async function storeProfilePicture(ctx, path) {
    return Person.findOneAndUpdate({
        _id: ctx.currentUser._id
    }, {profile_picture: path}).exec()
}

//find twinpals
router.get('/twinpals', authenticate, async ctx => {
    await  queries.findTwinpals(ctx).then(function (person) {
        ctx.body = person
    }).catch(function (err) {
        ctx.status = 500
        ctx.body = err
    })
})

async function findTwinpals(ctx, birthday) {
    return Person.find({
        'birthday': birthday
    }).where('_id').ne(ctx.session.user_id).select('_id first_name last_name').exec()
}

router.get('/twinpals/:id', authenticate, async ctx => {
    await Person.findOne({
        '_id': ctx.params.id
    }).select('username birthday profile_picture').exec().then(function (person) {
        ctx.body = person
    }).catch(function (err) {
        ctx.status = 500
        ctx.body = err
    })
})

/**
 * Handle the signup post request and register a new user
 */
router.post('/signup', koaBody, async ctx => {
    await higherValidation(ctx.request.body, validateInput).then(async function ({errors, isValid}) {
        if (isValid) {
            const {first_name, last_name, email, password, birthday} = ctx.request.body
            const password_digest = bcrypt.hashSync(password, 10)
            await new Person({
                first_name: first_name,
                last_name: last_name,
                password: password_digest,
                birthday: birthday,
                email: email,
                username: `${first_name} ${last_name}`,
                profile_picture: 'default.jpg',
                date_joined: new Date()
            }).save().then(function (success) {
                ctx.body = {success: true}
            }).catch(function (err) {
                ctx.status = 500
                ctx.body = err
            })
        } else {
            ctx.status = 400
            ctx.body = errors
        }
    }).catch(function () {

    })
})

function validateInput(data) {
    let errors = {}
    if (Validator.isEmpty(data.first_name)) {
        errors.first_name = 'This field is required'
    }
    if (Validator.isEmpty(data.last_name)) {
        errors.last_name = 'This field is required'
    }
    if (Validator.isEmpty(data.email)) {
        errors.email = 'This field is required'
    }
    if (!Validator.isEmail(data.email)) {
        errors.email = 'This field must be an email'
    }
    if (Validator.isEmpty(data.password)) {
        errors.password = 'This field is required'
    }
    if (Validator.isEmpty(data.passwordConfirmation)) {
        errors.passwordConfirmation = 'This field is required'
    }
    if (!Validator.equals(data.password, data.passwordConfirmation)) {
        errors.passwordConfirmation = 'Passwords must match'
    }
    // if (!isDate(data.birthday)) {
    //     errors.birthday = 'Passwords must match'
    // }
    return {
        errors,
        isValid: isEmpty(errors)
    }
}

async function higherValidation(data, otherValidations) {
    let {errors} = otherValidations(data)
    return await Person.findOne({email: data.email}).exec().then(function (user) {
        if (user) {
            errors.email = 'There is a user with such email'
        }
        return {
            errors, isValid: isEmpty(errors)
        }
    })
}

/**
 *
 * @param details
 * @returns {Promise.<*>}
 * Do some validation of the user input
 */
async function registerDetails(details) {
    const newPerson = new Person({})
    try {
        await newPerson.save()
        return 'saved'
    }
    catch (err) {
        return err
    }
}


//show the admin sign in page
router.get('/tp/admin', async ctx => {
    // TODO  Remove the signup form in production.
    ctx.render('admin_signin')
})

//handle the admin login info
router.post('/tp/admin/login', koaBody, async ctx => {
    const details = ctx.request.body
    if (details.email.length < 1 || details.password.length < 1) {
        ctx.body = 'fill_all'
    }
    else {
        const query = Admin.findOne({
            'email': details.email,
            'password': details.password
        })
        query.select('name password')
        await query.exec().then(function (person) {
            //analyse the results from the database to know if the user is signed in.
            if (person !== null) {
                ctx.session.user_id = person.id
                ctx.session.role = person.role
                ctx.session.isNew = false
                ctx.body = 'logged in bruh'
            }
            else {
                ctx.body = 'You are not registered'
            }
        }).catch(function (err) {
            ctx.body = err
        })
    }
})

//handle the admin sign up info
router.post('/tp/admin/signup', koaBody, async ctx => {
    ctx.body = await registerAdminDetails(ctx.request.body)
})

//register admin details
async function registerAdminDetails(details) {
    if (details.password.length < 1 || details.confirm_password.length < 1 || details.username.length < 1 || details.email2.length < 1 || details.email.length < 1 || details.cellphone.length < 1) {
        return 'fill_all'
    }
    if (details.password !== details.confirm_password) {
        return 'password_missmatch'
    }
    //TODO hash the password,email
    const newAdmin = new Admin({
        email: details.email,
        email2: details.email2,
        password: details.password,
        cellphone: details.cellphone,
        username: details.username,
        role: 'system'
    })
    try {
        await newAdmin.save()
        return 'saved'
    }
    catch (err) {
        return err
    }

}

//handle updating of status
router.post('/posts/new', koaBody, authenticate, async ctx => {
    const post = ctx.request.body
    const body = post.fields.body
    const profile = post.fields.profile
    const upload = post.files.upload
    // console.log(post)
    if (body === '' && upload !== undefined) {
        // console.log(upload)
        const path = upload.path
        const uploader = ctx.currentUser._id
        const arraypath = path.split('\\')
        const filepath = `${uploader}/${arraypath[arraypath.length - 1]}`
        await queries.storeUpload(ctx, filepath).then(async function (upload) {
            const newPath = `./public/uploads/${filepath}`
            if (!fs.existsSync(`./public/uploads/${uploader}`))
                fs.mkdirSync(`./public/uploads/${uploader}`)
            fs.rename(ctx.request.body.files.upload.path, newPath)
            await new Post({
                author: ctx.currentUser.id,
                status: 'original',
                timestamp: new Date(),
                profile: profile,
                uploads: upload._id

            }).save({new: true}).then(async function (post) {
                await post.populate('uploads').populate('author', 'username profile_picture').populate('profile', 'username profile_picture').execPopulate().then(async function (pos) {
                    ctx.status = 200
                    ctx.body = pos
                    Person.findOneAndUpdate({
                        _id: ctx.currentUser.id
                    }, {$push: {uploads: upload._id}}).exec()

                })
            }).catch(function (err) {
                ctx.status = 500
                ctx.body = {errors: err}
            })
        })

    } else if (upload === undefined && body !== '') {
        // console.log("sdf")
        await new Post({
            body: body,
            author: ctx.currentUser.id,
            status: 'original',
            timestamp: new Date(),
            profile: profile
        }).save({new: true}).then(async function (post) {
            await post.populate('author', 'username profile_picture').populate('profile', 'username profile_picture').execPopulate().then(function (pos) {
                ctx.status = 200
                ctx.body = pos
                Person.findOneAndUpdate({
                    _id: ctx.currentUser.id
                }, {$push: {posts: post._id}}).exec()

            }).catch(function (err) {
                ctx.status = 500
                ctx.body = {errors: err}
            })
        })
    }
    else if (upload !== undefined && body !== '') {
        const path = upload.path
        const uploader = ctx.currentUser._id
        const arraypath = path.split('\\')
        const filepath = `${uploader}/${arraypath[arraypath.length - 1]}`
        await storeUpload(ctx, filepath).then(async function (upload) {
            const newPath = `./public/uploads/${filepath}`
            if (!fs.existsSync(`./public/uploads/${uploader}`))
                fs.mkdirSync(`./public/uploads/${uploader}`)
            fs.rename(ctx.request.body.files.upload.path, newPath)
            await new Post({
                body: body,
                author: ctx.currentUser.id,
                status: 'original',
                timestamp: new Date(),
                profile: profile,
                uploads: upload._id

            }).save({new: true}).then(async function (post) {
                await post.populate('uploads').populate('author', 'username profile_picture').populate('profile', 'username profile_picture').execPopulate().then(async function (pos) {
                    ctx.status = 200
                    ctx.body = pos
                    Person.findOneAndUpdate({
                        _id: ctx.currentUser.id
                    }, {$push: {uploads: upload._id}}).exec()
                })
            }).catch(function (err) {
                ctx.status = 500
                ctx.body = {errors: err}
            })
        })
    }

})


//handle liking of posts
router.post('/posts/like', koaBody, authenticate, async ctx => {
    await queries.likePost(ctx, ctx.request.body.postId).then(async function (post) {
        await post.populate('uploads').populate('author', 'username profile_picture').populate('profile', 'username profile_picture').execPopulate().then(function (pos) {
            ctx.status = 200
            ctx.body = pos
        })
    }).catch(function (err) {
        ctx.status = 500
        ctx.body = err
    })
})

//handle liking of posts
router.post('/comments/like', koaBody, authenticate, async ctx => {
    await queries.likeComment(ctx, ctx.request.body.commentId).then(function (comment) {
        ctx.status = 200
        ctx.body = comment
    }).catch(function (err) {
        ctx.status = 500
        ctx.body = err
    })
})


//handle unliking of posts
router.post('/posts/unlike', koaBody, authenticate, async ctx => {
    await queries.unlikePost(ctx, ctx.request.body.postId).then(async function (post) {
        await post.populate('uploads').populate('author', 'username profile_picture').populate('profile', 'username profile_picture').execPopulate().then(function (pos) {
            ctx.status = 200
            ctx.body = pos
        })
    }).catch(function (err) {
        ctx.status = 500
        ctx.body = err
    })
})


//editing a post
router.get('/posts/edit/:id', async ctx => {
    await Post.findOne({_id: ctx.params.id}).select('body').exec().then(function (post) {
        ctx.render('edit_posts', {post: post})
    })
})
//update a post
router.post('/posts/edit', koaBody, authenticate, async ctx => {
    console.log(ctx.request.body.fields.body)
    if (ctx.request.body.fields.body !== '') {

        await queries.updatePost(ctx.request.body.fields).then(async function (post) {
            await post.populate('uploads').populate('author', 'username profile_picture').populate('profile', 'username profile_picture').execPopulate().then(async function (pos) {
                if (pos) {
                    ctx.body = pos
                }
            }).catch(function (err) {
                ctx.status = 500
                ctx.body = err
            })
        }).catch(function (err) {
            ctx.status = 500
            ctx.body = err
        })
    }
})


//display the comment form
router.get('/posts/comments/:id', async ctx => {
    await Comment.find({post: ctx.params.id}).sort({timestamp: -1}).exec().then(function (comments) {
        // if(comments){
        //
        // }
        ctx.body = comments
        // else{
        //     ctx.status=404
        //     ctx.body={errors:'No comments found for this post'}
        // }
    }).catch(function (err) {
        ctx.status = 500
        ctx.body = err
    })
})
//insert a comment on a post
router.post('/posts/comment/', koaBody, authenticate, async ctx => {
    await queries.storeComment(ctx, ctx.request.body).then(function (comment) {
        ctx.body = comment
    }).catch(function (err) {
        ctx.status = 500
        ctx.body = err
    })
})

//edit profile details
router.get('/profile/edit/:id', async ctx => {
    await Person.findOne({_id: ctx.params.id}).exec().then(async function (person) {
        ctx.render('edit_profile', {profile: person})
    })
})
//receive update information from the update form
router.post('/profile/edit', koaBody, authenticate, async ctx => {
    await queries.updateProfile(ctx, ctx.request.body).then(function (profile) {
        ctx.status = 200
        ctx.body = 'success'
    })
})


//handle upload of files
router.post('/profile/upload', koaBody, async ctx => {
    //rename the file with what the user keyed in

    const path = ctx.request.body.files.upload.path
    const uploader = ctx.session.user_id
    const arraypath = path.split('\\')
    const filepath = `${uploader}/${arraypath[arraypath.length - 1]}`

    await storeUpload(ctx, filepath).then(async function (response) {
        const newPath = `./public/uploads/${filepath}`
        await ctx.redirect('/profile')
        if (!fs.existsSync(`./public/uploads/${uploader}`))
            fs.mkdirSync(`./public/uploads/${uploader}`)
        fs.rename(ctx.request.body.files.upload.path, newPath)
    })
})


//get the uploads made by the user
router.get('/profile/uploads/:id', async ctx => {
    await Upload.find({uploader: ctx.session.user_id}).select('path timestamp').exec().then(function (uploads) {
        ctx.render('uploads', {uploads: uploads})
    })
})
//delete posts
router.get('/posts/delete/:id', authenticate, async ctx => {
    await queries.deletePost(ctx, ctx.params.id).then(function (deleted) {
        if (deleted) {
            ctx.body = deleted
        }
    }).catch(function (err) {
        ctx.status = 500
        ctx.body = err
    })
})


//delete the upload made by the user
router.get('/uploads/delete/:id', async ctx => {
    await queries.deleteUpload(ctx, ctx.params.id).then(async function (deleted) {
        ctx.redirect(`/profile/uploads/${ctx.session.user_id}`)
    })
})

//remove profile picture
router.get('/profile/remove_profile_picture', async ctx => {
    await Person.findByIdAndUpdate({_id: ctx.session.user_id}, {
        profile_picture: 'default.jpg'
    }).exec().then(function (removed) {
        ctx.redirect('/profile')
    })
})
//delete account
router.get('/post/delete_account', async ctx => {
    // ctx.body='ffghfg'
    await queries.deleteAccount(ctx).then(function (deleted) {
        ctx.session = null
        ctx.redirect('/')
    })
})


router.get('/twinpal/users/:id', async ctx => {
    await Person.findById(ctx.params.id).select('_id username profile_picture').exec().then(function (person) {
        ctx.body = person
    }).catch(function (err) {
        ctx.status = 500
        ctx.body = err
    })
})
app.use(router.routes())
pug.use(app)
app.use(cors())
app.use(session(CONFIG, app))
pug.use(app)

module.exports = app