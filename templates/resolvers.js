const resolvers={
    Query: {
        allUsers: async (parent, args,{User}) => {
            return await User.find().exec()
        },
    },
    Mutation: {
        createUser :async (parent, args, {User})=> await new User(args).save(),
    },
}
module.exports = resolvers