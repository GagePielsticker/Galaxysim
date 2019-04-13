module.exports = client => {

    /**
     * Handles the message event fired by client
     * @param {Object} message
     */
    client.on('message', async message => {
        if(message.author.bot) return
        if(!message.content.toLowerCase().startsWith(client.settings.prefix)) return
        let command = message.content.split(' ')[0].replace(client.settings.prefix, '')
        if(!client.commandExist(command)) return
        if(client.commands[command].settings.type == 'game') {
            let user = await client.db.collection('users').findOne({id:message.author.id})
            if(user == null) await client.game.createAccount(message.author.id)
        }
        await client.commands[command].run(message)
    })

    /**
     * Anonymous function that handles ready event and loads commands
     */
    client.on('ready', () => {
        client.log('Bot started')
        client.loadCommandFolder('general')
            .then(client.log('Successfully loaded general commands.'))
            .catch(e => client.log(e))
        client.loadCommandFolder('developer')
            .then(client.log('Successfully loaded developer commands.'))
            .catch(e => client.log(e))
        client.loadCommandFolder('game')
            .then(client.log('Successfully loaded game commands.'))
            .catch(e => client.log(e))
        client.connectDb()
            .then(client.log('Connected Database.'))
            .catch(e => client.log(e))
        client.user.setActivity(client.settings.activity, { type: 'Playing' }) 
    })

    /**
     * Takes shard object on shard ready and outputs.
     * @param {Object} shard
     */
    client.on('shardReady', shard => {
        client.log(`Shard Ready : ${shard} | total : ${client.options.shards}`)
    })    
}