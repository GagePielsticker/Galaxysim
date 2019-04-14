module.exports.load = client => {
    client.commands['help'] = {

        settings : {
            'type' : 'general',
            'description' : 'Helps user with commands.',
            'usage' : `${client.settings.prefix}help {command}`
        },

        async run(message) {
            if(message.content.split(' ').length == 1){
                let generalCommands = []
                let gameCommands = []

                for(entry in Object.entries(client.commands)){
                    let command = Object.entries(client.commands)[entry]
                    if(command[1].settings.type == 'general') generalCommands.push(command[0])
                    if(command[1].settings.type == 'game') gameCommands.push(command[0])
                }

                let embed = new client.discord.MessageEmbed()
                .setTitle('Help')
                .setDescription(`Use \`${client.settings.prefix}help {command}\` to learn more about the command.`)
                .addField('General', `\`\`\`${generalCommands.join(' ')}\`\`\``)
                .addField('Game', `\`\`\`${gameCommands.join(' \n')}\`\`\`Voting [Here](https://discordbots.org/bot/541536124326117387/vote) grants a 20% boost to industry, for assistance click [Here](https://discord.gg/yMsvHZx).`)
                .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                .setTimestamp()
                .setColor(client.settings.embedColor)
                message.channel.send(embed)
            } else {
                let command = message.content.split(' ').splice(1)[0]
                let cmdInfo
                for(entry in Object.entries(client.commands)){
                    if(Object.entries(client.commands)[entry][0] == command){
                        cmdInfo = Object.entries(client.commands)[entry][1].settings
                    }
                }
                if(!cmdInfo) return client.sendError(message, 'Command not found.')
                let embed = new client.discord.MessageEmbed()
                .setTitle(command)
                .addField('Description', `\`\`\`${cmdInfo.description}\`\`\``)
                .addField('Usage', `\`\`\`${cmdInfo.usage}\`\`\``)
                .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                .setTimestamp()
                .setColor(client.settings.embedColor)
                message.channel.send(embed)
            }
        }
    }
}