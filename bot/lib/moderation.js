module.exports = client => {

    //setup game object on client
    client.moderation = {}

    //shorten name for my sanity
    let mod = client.moderation

    //setup empty settings object to fill
    mod.settings = {}

    //quality of life shortening
    let set = mod.settings

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
                welcomeMessage: '',
                leaveMessage: ''
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
    mod.hasPerm = async (id, executor, perm) => {
        let g = await client.guilds.get(id)
        let member = g.member(executor)
        if(!member.hasPermission(perm)) return false
        return true
    }

    /**
     * Set the welcome message in guild database
     * @param {String} id discord guild id
     * @param {String} string Welcome message string
     * @param {String} executor Executor of function
     * @returns {Promise}
     */
    set.welcomeMessage = (id, string, executor) => {
        return new Promise(async (resolve, reject) => {

            //load guild
            let guild = await client.db.collection('guilds').findOne({id: id})

            //check if string is empty
            if(string.length == 0) return reject('You supplied an empty string.')

            //check if executor has administrator permissions
            if(!mod.hasPerm(id, executor, 'ADMINISTRATOR')) return reject('User is not administrator.')
            
            //set welcome message to string in database
            client.db.collection('guilds').updateOne({id:id}, {$set:{welcomeMessage:string}}, {upsert:true})

            //resolve
            resolve()
        })
    }

    /**
     * Set the leave message in guild database
     * @param {String} id discord guild id
     * @param {String} string Leave message string
     * @param {String} executor Executor of function
     * @returns {Promise}
     */
    set.leaveMessage = (id, string, executor) => {
        return new Promise(async (resolve, reject) => {

            //load guild
            let guild = await client.db.collection('guilds').findOne({id: id})

            //check if string is empty
            if(string.length == 0) return reject('You supplied an empty string.')

            //check if executor has administrator permissions
            if(!mod.hasPerm(id, executor, 'ADMINISTRATOR')) return reject('User is not administrator.')
            
            //set welcome message to string in database
            client.db.collection('guilds').updateOne({id:id}, {$set:{leaveMessage:string}}, {upsert:true})

            //resolve
            resolve()
        })
    }
}