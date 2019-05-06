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

        //If command is moderation related, check to see if guild exist in db
        if(client.commands[command].settings.type == 'moderation') {
            let guild = await client.db.collection('guilds').findOne({id:message.guild.id})
            if(guild == null) {
                await client.moderation.createGuild(message.guild.id)
                .then(() => client.log(`Created guild for ${message.guild.name}`))
            }
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
        client.loadCommandFolder('moderation').then(client.log('Successfully loaded moderation commands.'))    
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

        //if guild dosnt exist ignore
        if(g == null) return

        //Check if the welcome toggle is turned on
        if(g.welcomeToggle) {

            //Check if they have set a channel
            if(g.welcomeChannel != '') {
                //Get channel
                let channel = await member.guild.channels.get(g.welcomeChannel)

                //Format welcome message
                let message = await g.welcomeMessage.replace('{user}', `**${member.user.tag}**`)

                //Attempt to send message
                await channel.send(message)
            }
        }

        //Check if the autorole toggle is turned on
        if(g.autoRoleToggle) {

            //check if role is set
            if(g.autoRoleRole != '') {

                //edit user to include role
                await member.edit({ roles : [g.autoRoleRole] })
            }
        }
    })

    /**
     * Handles on user remove
     * @param {Object} member guild member
     */
    client.on('guildMemberRemove', async member => {
        
        //load guild entry
        let g = await client.db.collection('guilds').findOne({id:member.guild.id})

        //if guild dosnt exist ignore
        if(g == null) return

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

    /**
     * Handles message edit event
     * @param {Object} oldMessage discord message
     * @param {Object} newMessage discord message
     */
    client.on('messageUpdate', async (oldMessage, newMessage) => {

        //If content was changed
        if(oldMessage.content != newMessage.content) {

            //load guild entry
            let g = await client.db.collection('guilds').findOne({id:newMessage.guild.id})

            //if guild dosnt exist ignore
            if(g == null) return

            //Check if the toggle is turned on
            if(!g.chatLogToggle) return
            
            //Check if they have set a channel
            if(g.chatLogChannel == '') return

            //Get channel
            let channel = await newMessage.guild.channels.get(g.chatLogChannel)

            //Format log message
            let embed = new client.discord.MessageEmbed()
            .setTitle('Message Edited')
            .addField('Old', `\`\`\`${oldMessage.content} \`\`\``)
            .addField('New', `\`\`\`${newMessage.content} \`\`\``)
            .setFooter(`${newMessage.author.tag} (${newMessage.author.id})`, newMessage.author.avatarURL())
            .setTimestamp()
            .setColor(client.settings.embedColor)

            //send message
            await channel.send(embed)
            .catch(e => {return})
        }
    })

    client.on('messageDelete', async message => {
        //load guild entry
        let g = await client.db.collection('guilds').findOne({id:message.guild.id})

        //if guild dosnt exist ignore
        if(g == null) return
        
        //Check if the toggle is turned on
        if(!g.chatLogToggle) return
        
        //Check if they have set a channel
        if(g.chatLogChannel == '') return

        //Get channel
        let channel = await message.guild.channels.get(g.chatLogChannel)

        //check if message is bot
        if(message.author.bot) return

        //Format log message
        let embed = new client.discord.MessageEmbed()
        .setTitle('Message Deleted')
        .setDescription(`Message deleted in <#${message.channel.id}>.`)
        .addField('Content', `\`\`\`${message.content} \`\`\``)
        .setTimestamp()
        .setColor(client.settings.embedColor)

        //get most recent message delete audit log
        let entry = await message.guild.fetchAuditLogs({type: 'MESSAGE_DELETE'}).then(audit => audit.entries.first())
        .catch(() => {return})

        //Check if audit log is correct one
        if(message.channel.id == entry.extra.channel.id 
        && entry.target.id == message.author.id) {
            embed.setFooter(`${entry.executor.tag} (${entry.executor.id})`, entry.executor.avatarURL())
        } else {
            embed.setFooter(`${message.author.tag} (${message.author.id})`, message.author.avatarURL())
        }

        //send message
        await channel.send(embed)
        .catch(() => {return})
    })
}