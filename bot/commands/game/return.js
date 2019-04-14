module.exports.load = client => {
    client.commands['return'] = {
        settings : {
            type : 'game',
            description : 'Return to your closest alliance.',
            usage : `${client.settings.prefix}return`
        },

        async run(message) {
            let args = message.content.split(' ').splice(1)
            
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            if(client.game.cooldowns.warp.includes(message.author.id)) return client.sendError(message, 'You are currently warping.')
            if(client.game.cooldowns.mining.includes(message.author.id)) return client.sendError(message, 'You are currently mining.')
            if(client.game.cooldowns.processing.includes(message.author.id)) return client.sendError(message, 'You are currently processing ore.')

            client.sendCheck(message, `You are about to warp to your closest colony or trade hub to refuel.`)
            const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
            collector.on('collect', message => {
                if (message.content.toLowerCase() == 'yes') {
                    client.game.returnUser(message.author.id)
                    .then(travelInfo => {
                        let finalEmbed = new client.discord.MessageEmbed()
                        finalEmbed.setTitle('Warp')
                        finalEmbed.setDescription(`Began warping... This will take \`${client.humanize(travelInfo.travelTime * 1000)}\``)
                        finalEmbed.setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                        finalEmbed.setTimestamp()
                        finalEmbed.setColor(client.settings.embedColor)
                        message.channel.send(finalEmbed)
                        setTimeout(() => {
                            message.reply('Successfully warped.')
                        }, travelInfo.travelTime * 1000)
                    })
                    .catch(e => client.sendError(message, e))
                    client.game.cooldowns.collector.splice(client.game.cooldowns.collector.indexOf(message.author.id), 1)
                    collector.stop()
                }
                if (message.content.toLowerCase() == 'no') {
                    client.sendError(message, 'Action cancelled.')
                    client.game.cooldowns.collector.splice(client.game.cooldowns.collector.indexOf(message.author.id), 1)
                    collector.stop()
                }
            })
        }
    }
}