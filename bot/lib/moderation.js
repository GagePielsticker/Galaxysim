module.exports = client => {

    //setup game object on client
    client.moderation = {}

    //shorten name for my sanity
    let mod = client.moderation

    /**
     * Creates guild in database
     * @param {String} id
     */
    mod.createGuild = (id) => {
        return new Promise(async (resolve, reject) => {
            
            //check if guild exist
            let guild = await client.db.collection('guilds').findOne({id: id})
            
            //if there is an entry reject
            if(guild != null) return reject('Guild exist in database.')

            //setup default guild object for database
            let newGuild = {
                id: id
            }

            //write guild to database
            await client.db.collection('guilds').insert(newGuild)

            //resolve
            await resolve()
        })
    }



}