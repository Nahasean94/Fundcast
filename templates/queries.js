const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/slack', {promiseLibrary: global.Promise})
const {User,Team,Channel,Message,Member}=require('./models')

const queries={
    createUser:async (username,email,password)=>{
        return await new User({
            username:username,
            email:email,
            password:password
        }).save()
    }

}

module.exports=queries
