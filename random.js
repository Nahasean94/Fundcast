const queries=require('databases/queries')
console.log( queries.findTwinpals(ctx).then(async function (twinpals) {
    if (twinpals.length < 1) {
        ctx.status = 404
        ctx.body = {error: 'No such post'}
    }
    else {
        let allPosts = []
        return await twinpals.map(async twinpal => {
            await queries.findUserPosts(twinpal._id).then(function (posts) {
                if (posts.length < 1) {
                    // ctx.status = 404
                    // ctx.body = {error: 'No such post'}
                }
                else {
                    allPosts.push(posts)
                    return allPosts
                }
            }).catch(function (err) {
                console.log(err)
            })
        })


    }
}).catch(function (err) {
    ctx.status = 500
    ctx.body = {error: err}

}))
