module.exports.load = client => {
    client.commands['process'] = {
        settings : {
            type : 'game',
            description : 'Process ore into fuel on ship.',
            usage : `${client.settings.prefix}process {#}`
        },

        async run(message) {
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            if(client.game.cooldowns.warp.includes(message.author.id)) return client.sendError(message, 'You are currently warping.')
            if(client.game.cooldowns.mining.includes(message.author.id)) return client.sendError(message, 'You are currently mining.')
            if(client.game.cooldowns.processing.includes(message.author.id)) return client.sendError(message, 'You are currently processing ore.')
            
            let args = message.content.split(' ').splice(1)
            if(args.length != 1) return client.sendError(message, 'Invalid usage.')
            client.sendCheck(message, `You are about to reprocess \`${Math.floor(args[0] * client.settings.game.oreFuelConversion)}\` ore into \`${args[0]}\` fuel blocks.`)
            const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
            collector.on('collect', message => {
                if (message.content.toLowerCase() == 'yes') {
                    client.game.processOres(message.author.id, parseInt(args[0]))
                    .then(() => {
                        let initEmbed = new client.discord.MessageEmbed()
                        initEmbed.setTitle('Process')
                        initEmbed.setDescription(`Activating reprocessor...`)
                        initEmbed.setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                        initEmbed.setTimestamp()
                        initEmbed.setColor(client.settings.embedColor)
                        message.channel.send(initEmbed)
                        setTimeout(() => {
                            let finalEmbed = new client.discord.MessageEmbed()
                            finalEmbed.setTitle('Process')
                            finalEmbed.setDescription(`You successfully processed your ores into fuel.`)
                            finalEmbed.setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                            finalEmbed.setTimestamp()
                            finalEmbed.setColor(client.settings.embedColor)
                            message.channel.send(finalEmbed)
                        }, client.settings.game.processingTimePerBlock * args[0] * 1000)
                        client.game.cooldowns.collector.splice(client.game.cooldowns.collector.indexOf(message.author.id), 1)
                    })
                    .catch(e => client.sendError(message, e))
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