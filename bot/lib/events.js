module.exports = client => {

    /**
     * Handles the message event fired by client
     * @param {Object} message discord message
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
        if(client.commands[command].settings.type == 'moderation') {
            let guild = await client.db.collection('guilds').findOne({id:message.guild.id})
            if(guild == null) {
                await client.moderation.createGuild(message.guild.id)
                .then(() => client.log(`Created guild for ${message.guild.name}`))
            }
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
        client.loadCommandFolder('developer')
            .then(client.log('Successfully loaded developer commands.'))
        client.loadCommandFolder('game')
            .then(client.log('Successfully loaded game commands.'))
        client.loadCommandFolder('moderation')
            .then(client.log('Successfully loaded moderation commands.'))    
        client.connectDb()
            .then(client.log('Connected Database.'))
        client.user.setActivity(client.settings.activity, { type: 'Playing' }) 
    })

    /**
     * Takes shard object on shard ready and outputs.
     * @param {Object} shard shard
     */
    client.on('shardReady', shard => {
        client.log(`Shard Ready : ${shard} | total : ${client.options.shards}`)
    })
    
    /**
     * Handles client join guild
     * @param {Object} guild guild
     */
    client.on('guildCreate', async guild => {
        
        //loead guild entry
        let g = await client.db.collection('guilds').findOne({id:guild.id})

        //if it doesnt exist create it
        if(g == null) await client.moderation.createGuild(guild.id)
    })

    /**
     * Handles on user join
     * @param {Object} member guild member
     */
    client.on('guildMemberAdd', async member => {
        
        //load guild entry
        let g = await client.db.collection('guilds').findOne({id:member.guild.id})

        //Check if the toggle is turned on
        if(!g.welcomeToggle) return
        
        //Check if they have set a channel
        if(g.welcomeChannel == '') return

        //Get channel
        let channel = await member.guild.channels.get(g.welcomeChannel)

        //Format welcome message
        let message = g.welcomeMessage.replace('{user}', `**${member.user.tag}**`)

        //Attempt to send message
        channel.send(message)
    })

    /**
     * Handles on user remove
     * @param {Object} member guild member
     */
    client.on('guildMemberRemove', async member => {
        
        //load guild entry
        let g = await client.db.collection('guilds').findOne({id:member.guild.id})

        //Check if the toggle is turned on
        if(!g.leaveToggle) return
        
        //Check if they have set a channel
        if(g.leaveChannel == '') return

        //Get channel
        let channel = await member.guild.channels.get(g.leaveChannel)

        //Format welcome message
        let message = g.leaveMessage.replace('{user}', `**${member.user.tag}**`)

        //Attempt to send message
        channel.send(message)
    })
}