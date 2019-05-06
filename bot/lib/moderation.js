module.exports = client => {

    //setup game object on client
    client.moderation = {}

    //shorten name for my sanity
    let mod = client.moderation

    /**
     * Creates guild in database
     * @param {String} id discord guild id
     * @returns {Promise}
     */
    mod.createGuild = id => {
        return new Promise(async (resolve, reject) => {
            
            //check if guild exist
            let guild = await client.db.collection('guilds').findOne({id: id})
            
            //if there is an entry reject
            if(guild != null) return reject('Guild exist in database.')

            //setup default guild object for database
            let newGuild = {
                id: id,
                welcomeMessage: 'Welcome to the server {user}!',
                leaveMessage: '{user} has left the server.',
                welcomeToggle: false,
                leaveToggle: false,
                welcomeChannel: '',
                leaveChannel: '',
                chatLogChannel: '',
                chatLogToggle: false,
                autoRoleRole: '',
                autoRoleToggle: false,
                modLogChannel: '',
                modLogToggle: false
            }

            //write guild to database
            await client.db.collection('guilds').insert(newGuild)

            //resolve
            await resolve()
        })
    }

    /**
     * Checks if user has permissions
     * @param {String} id guild id
     * @param {String} executor executor id
     * @returns {Boolean}
     */
    mod.hasPerm = (id, executor, perm) => {
        let g = client.guilds.get(id)
        let member = g.members.get(executor)
        if(!member.hasPermission(perm)) return false
        return true
    }
}