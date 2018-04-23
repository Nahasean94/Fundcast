import queries from '../databases/queries'
module.exports={
    Query:{
        allUsers: async (parent,args)=>{
            return await queries.findUsers()
        }
    }
}