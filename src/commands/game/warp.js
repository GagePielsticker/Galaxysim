module.exports.load = client => {
    client.commands['warp'] = {
        settings : {
            type : 'game',
            description : 'Warp to a new location.',
            usage : `${client.settings.prefix}warp {x} {y}`
        },

        async run(message) {
            let args = message.content.split(' ').splice(1)
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            if(client.game.cooldowns.warp.includes(message.author.id)) return client.sendError(message, 'You are currently warping.')
            if(args.length != 2) return client.sendError(message, 'Invalid usage.')
            let targetX = parseInt(args[0])
            let targetY = parseInt(args[1])
            let travelDetails = await client.game.getWarpInfo(message.author.id, targetX, targetY)
            client.sendCheck(message, `Are you sure you want to warp? This will use \`${travelDetails.distance}\` fuel and take \`${client.humanize(travelDetails.travelTime * 1000)}.\``)
            const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
            collector.on('collect', message => {
                if (message.content.toLowerCase() == 'yes') {
                    client.game.warpUser(message.author.id, targetX, targetY)
                    .then(() => {
                        let embed = new client.discord.MessageEmbed()
                        embed.setTitle('Warp')
                        embed.setDescription(`Initiated warp`)
                        embed.setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                        embed.setTimestamp()
                        embed.setColor(client.settings.embedColor)
                        message.channel.send(embed)
                        setTimeout(() => {
                            message.reply('Your warp has ended.')
                        }, travelDetails.travelTime * 1000)   
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