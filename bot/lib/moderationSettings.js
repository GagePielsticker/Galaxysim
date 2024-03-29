module.exports = client => {

    //setup empty settings object to fill
    client.moderation.settings = {}

    //quality of life shortening
    let set = client.moderation.settings

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
            if(!client.moderation.hasPerm(id, executor, 'ADMINISTRATOR')) return reject('User is not administrator.')
            
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
            if(!client.moderation.hasPerm(id, executor, 'ADMINISTRATOR')) return reject('User is not administrator.')
            
            //set welcome message to string in database
            client.db.collection('guilds').updateOne({id:id}, {$set:{leaveMessage:string}}, {upsert:true})

            //resolve
            resolve()
        })
    }

    /**
     * Set the leave toggle in guild database
     * @param {String} id discord guild id
     * @param {Boolean} bool
     * @param {String} executor Executor of function
     * @returns {Promise}
     */
    set.leaveToggle = (id, bool, executor) => {
        return new Promise(async (resolve, reject) => {

            //load guild
            let guild = await client.db.collection('guilds').findOne({id: id})

            //check if executor has administrator permissions
            if(!client.moderation.hasPerm(id, executor, 'ADMINISTRATOR')) return reject('User is not administrator.')
            
            //set welcome message to string in database
            client.db.collection('guilds').updateOne({id:id}, {$set:{leaveToggle:bool}}, {upsert:true})

            //resolve
            resolve()
        })
    }

    /**
     * Set the welcome toggle in guild database
     * @param {String} id discord guild id
     * @param {Boolean} bool
     * @param {String} executor Executor of function
     * @returns {Promise}
     */
    set.welcomeToggle = (id, bool, executor) => {
        return new Promise(async (resolve, reject) => {

            //load guild
            let guild = await client.db.collection('guilds').findOne({id: id})

            //check if executor has administrator permissions
            if(!client.moderation.hasPerm(id, executor, 'ADMINISTRATOR')) return reject('User is not administrator.')
            
            //set welcome message to string in database
            client.db.collection('guilds').updateOne({id:id}, {$set:{welcomeToggle:bool}}, {upsert:true})

            //resolve
            resolve()
        })
    }

    /**
     * Set the welcome channel in guild database
     * @param {String} id discord guild id
     * @param {String} channel Channel id
     * @param {String} executor Executor of function
     * @returns {Promise}
     */
    set.welcomeChannel = (id, channel, executor) => {
        return new Promise(async (resolve, reject) => {

            //load guild
            let guild = await client.db.collection('guilds').findOne({id: id})

            //check if executor has administrator permissions
            if(!client.moderation.hasPerm(id, executor, 'ADMINISTRATOR')) return reject('User is not administrator.')
            
            //set welcome message to string in database
            client.db.collection('guilds').updateOne({id:id}, {$set:{welcomeChannel:channel}}, {upsert:true})

            //resolve
            resolve()
        })
    }
    
    /**
     * Set the leave channel in guild database
     * @param {String} id discord guild id
     * @param {String} channel Channel id
     * @param {String} executor Executor of function
     * @returns {Promise}
     */
    set.leaveChannel = (id, channel, executor) => {
        return new Promise(async (resolve, reject) => {

            //load guild
            let guild = await client.db.collection('guilds').findOne({id: id})

            //check if executor has administrator permissions
            if(!client.moderation.hasPerm(id, executor, 'ADMINISTRATOR')) return reject('User is not administrator.')
            
            //set welcome message to string in database
            client.db.collection('guilds').updateOne({id:id}, {$set:{leaveChannel:channel}}, {upsert:true})

            //resolve
            resolve()
        })
    }

    /**
     * Set the chat log channel
     * @param {String} id discord guild id
     * @param {String} channel Channel id
     * @param {String} executor Executor of function
     * @returns {Promise}
     */
    set.chatLogChannel = (id, channel, executor) => {
        return new Promise(async (resolve, reject) => {

            //load guild
            let guild = await client.db.collection('guilds').findOne({id: id})

            //check if executor has administrator permissions
            if(!client.moderation.hasPerm(id, executor, 'ADMINISTRATOR')) return reject('User is not administrator.')
            
            //set welcome message to string in database
            client.db.collection('guilds').updateOne({id:id}, {$set:{chatLogChannel:channel}}, {upsert:true})

            //resolve
            resolve()
        })
    }

    /**
     * Set the log channel
     * @param {String} id discord guild id
     * @param {String} channel Channel id
     * @param {String} executor Executor of function
     * @returns {Promise}
     */
    set.modLogChannel = (id, channel, executor) => {
        return new Promise(async (resolve, reject) => {

            //load guild
            let guild = await client.db.collection('guilds').findOne({id: id})

            //check if executor has administrator permissions
            if(!client.moderation.hasPerm(id, executor, 'ADMINISTRATOR')) return reject('User is not administrator.')
            
            //set welcome message to string in database
            client.db.collection('guilds').updateOne({id:id}, {$set:{modLogChannel:channel}}, {upsert:true})

            //resolve
            resolve()
        })
    }

    /**
     * Set the chat log toggle
     * @param {String} id discord guild id
     * @param {Boolean} bool
     * @param {String} executor Executor of function
     * @returns {Promise}
     */
    set.chatLogToggle = (id, bool, executor) => {
        return new Promise(async (resolve, reject) => {

            //load guild
            let guild = await client.db.collection('guilds').findOne({id: id})

            //check if executor has administrator permissions
            if(!client.moderation.hasPerm(id, executor, 'ADMINISTRATOR')) return reject('User is not administrator.')
            
            //set welcome message to string in database
            client.db.collection('guilds').updateOne({id:id}, {$set:{chatLogToggle:bool}}, {upsert:true})

            //resolve
            resolve()
        })
    }

    /**
     * Set the mod log toggle
     * @param {String} id discord guild id
     * @param {Boolean} bool
     * @param {String} executor Executor of function
     * @returns {Promise}
     */
    set.modLogToggle = (id, bool, executor) => {
        return new Promise(async (resolve, reject) => {

            //load guild
            let guild = await client.db.collection('guilds').findOne({id: id})

            //check if executor has administrator permissions
            if(!client.moderation.hasPerm(id, executor, 'ADMINISTRATOR')) return reject('User is not administrator.')
            
            //set welcome message to string in database
            client.db.collection('guilds').updateOne({id:id}, {$set:{modLogToggle:bool}}, {upsert:true})

            //resolve
            resolve()
        })
    }

    /**
     * Set the autorole role
     * @param {String} id discord guild id
     * @param {String} role Role id
     * @param {String} executor Executor of function
     * @returns {Promise}
     */
    set.autoRoleRole = (id, role, executor) => {
        return new Promise(async (resolve, reject) => {

            //load guild
            let guild = await client.db.collection('guilds').findOne({id: id})

            //check if executor has administrator permissions
            if(!client.moderation.hasPerm(id, executor, 'ADMINISTRATOR')) return reject('User is not administrator.')
            
            //set welcome message to string in database
            client.db.collection('guilds').updateOne({id:id}, {$set:{autoRoleRole:role}}, {upsert:true})

            //resolve
            resolve()
        })
    }

    /**
     * Set the autoRole toggle log toggle
     * @param {String} id discord guild id
     * @param {Boolean} bool
     * @param {String} executor Executor of function
     * @returns {Promise}
     */
    set.autoRoleToggle = (id, bool, executor) => {
        return new Promise(async (resolve, reject) => {

            //load guild
            let guild = await client.db.collection('guilds').findOne({id: id})

            //check if executor has administrator permissions
            if(!client.moderation.hasPerm(id, executor, 'ADMINISTRATOR')) return reject('User is not administrator.')
            
            //set welcome message to string in database
            client.db.collection('guilds').updateOne({id:id}, {$set:{autoRoleToggle:bool}}, {upsert:true})

            //resolve
            resolve()
        })
    }

}