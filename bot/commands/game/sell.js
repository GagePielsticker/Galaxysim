module.exports.load = client => {
    client.commands['sell'] = {
        settings : {
            type : 'game',
            description : 'Sell ore quickly to a system, produces less credits then processing.',
            usage : `${client.settings.prefix}sell ore {#}`
        },

        async run(message) {
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            if(client.game.cooldowns.warp.includes(message.author.id)) return client.sendError(message, 'You are currently warping.')
            if(client.game.cooldowns.mining.includes(message.author.id)) return client.sendError(message, 'You are currently mining.')
            if(client.game.cooldowns.processing.includes(message.author.id)) return client.sendError(message, 'You are currently processing ore.')
            let args = message.content.split(' ').splice(1)

            if(args[0] == 'ore'){
                if(!args[2]) args[2] = 'all'
                client.sendCheck(message, `You are about to sell \`${args[2]}\` ore.`)
                const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
                collector.on('collect', message => {
                    if (message.content.toLowerCase() == 'yes') {
                        client.game.sellOre(message.author.id, parseInt(args[1]))
                        .then(a => message.reply(`Successfully sold ore for \`${a}\` credits.`))
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
}