module.exports.load = client => {
    client.commands['help'] = {

        conf : {
            'name' : 'Help',
            'type' : 1,
            'description' : 'Helps user with commands.',
            'usage' : `${client.settings.prefix}help {command}`
        },

        async run(message) {
            if(message.content.split(' ').length == 1){
                let dev_name_array = [] //type 0
                let gen_name_array = [] //type 1
                let game_name_array = [] //type 2
    
                for(entry in Object.entries(client.commands)){
                    if(Object.entries(client.commands)[entry][1].conf.type == 0){
                        dev_name_array.push(Object.entries(client.commands)[entry][0])
                    }
                    if(Object.entries(client.commands)[entry][1].conf.type == 1){
                        gen_name_array.push(Object.entries(client.commands)[entry][0])
                    }
                    if(Object.entries(client.commands)[entry][1].conf.type == 2){
                        game_name_array.push(Object.entries(client.commands)[entry][0])
                    }
                }
    
                let embed = new client.discord.RichEmbed()
                .setTitle('Help')
                .setDescription(`Use \`${client.settings.prefix}help {command}\` to learn more about the command.`)
    
                .addField('General', `\`\`\`${gen_name_array.join(' ')}\`\`\``)
                .addField('Game', `\`\`\`${game_name_array.join(' ')}\`\`\`Voting [Here](https://discordbots.org/bot/541536124326117387/vote) grants a 20% boost to industry, for assistance click [Here](https://discord.gg/yMsvHZx).`)
                .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                .setTimestamp()
                .setColor(client.settings.embed_color)
                if(client.settings.developers.includes(message.author.id)){
                    embed.addField('Developer', `\`\`\`${dev_name_array.join(' ')}\`\`\``)
                }
                message.channel.send(embed)
                
            } else {
                let command = message.content.split(' ').splice(1)[0]
                let cmd_info = null
                for(entry in Object.entries(client.commands)){
                    if(Object.entries(client.commands)[entry][0] == command){
                        cmd_info = Object.entries(client.commands)[entry][1].conf
                    }
                }
                if(cmd_info == null) return client.send_error(message, 'That command doesn\'t exist.')

                let embed = new client.discord.RichEmbed()
                .setTitle(cmd_info.name)
                .addField('Description', `\`\`\`${cmd_info.description}\`\`\``)
                .addField('Usage', `\`\`\`${cmd_info.usage}\`\`\``)
                .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                .setTimestamp()
                .setColor(client.settings.embed_color)
                message.channel.send(embed)
            }
        }
    }
}