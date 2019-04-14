module.exports.load = client => {
    client.commands['colonize'] = {
        settings : {
            type : 'game',
            description : 'Colonize a planet.',
            usage : `${client.settings.prefix}colonize {planet}`
        },

        async run(message) {
            let args = message.content.split(' ').splice(1)
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            if(client.game.cooldowns.warp.includes(message.author.id)) return client.sendError(message, 'You are currently warping.')
            let cost = await client.game.getNextColonyCost(message.author.id)
            client.sendCheck(message, `Are you sure you want to colonize \`${args[0]}\`? This will cost \`${cost.toLocaleString()}\` credits.`)
            const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
            collector.on('collect', message => {
                if (message.content.toLowerCase() == 'yes') {
                    client.game.colonizePlanet(message.author.id, args[0])
                    .then(() => message.reply('Successfully colonized.'))
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