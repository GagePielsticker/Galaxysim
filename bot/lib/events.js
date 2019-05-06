module.exports = client => {

    /**
     * Handles the message event fired by client
     * @param {Object} message discord message
     */
    client.on('message', async message => {

        //basic command handling
        if(message.author.bot) return
        if(!message.content.toLowerCase().startsWith(client.settings.prefix)) return
        let command = message.content.split(' ')[0].replace(client.settings.prefix, '')
        if(!client.commandExist(command)) return

        //If command is game related, check to see if the user exist in db
        if(client.commands[command].settings.type == 'game') {
            let user = await client.db.collection('users').findOne({id:message.author.id})
            if(user == null) await client.game.createAccount(message.author.id)
        }

        //run command
        await client.commands[command].run(message)
    })

    /**
     * Anonymous function that handles ready event and loads commands
     */
    client.on('ready', () => {
        client.log('Bot started')
        client.loadCommandFolder('general').then(client.log('Successfully loaded general commands.'))
        client.loadCommandFolder('developer').then(client.log('Successfully loaded developer commands.'))
        client.loadCommandFolder('game').then(client.log('Successfully loaded game commands.'))
        client.connectDb().then(client.log('Connected Database.'))
        client.user.setActivity(client.settings.activity, { type: 'Playing' }) 
    })

    /**
     * Takes shard object on shard ready and outputs.
     * @param {Object} shard shard
     */
    client.on('shardReady', shard => {
        client.log(`Shard Ready : ${shard} | total : ${client.options.shards}`)
    })
    
}