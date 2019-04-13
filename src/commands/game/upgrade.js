module.exports.load = client => {
    client.commands['upgrade'] = {
        settings : {
            type : 'game'
        },

        async run(message) {
            let args = message.content.split(' ').splice(1)
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            if(client.game.cooldowns.warp.includes(message.author.id)) return client.sendError(message, 'You are currently warping.')
            if(client.game.cooldowns.mining.includes(message.author.id)) return client.sendError(message, 'You are currently mining.')
            if(client.game.cooldowns.processing.includes(message.author.id)) return client.sendError(message, 'You are currently processing ore.')
            client.game.getNextUpgradeCost(message.author.id, args[0], parseInt(args[1]))
            .then(cost => {
                client.sendCheck(message, `You are about to upgrade your ships \`${args[0]}\` system which will take \`${cost}\` credits.`)
                const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
                collector.on('collect', message => {
                    if (message.content.toLowerCase() == 'yes') {
                        client.game.upgradeShip(message.author.id, args[0], parseInt(args[1]))
                        .then(() => message.reply('Successfully upgraded ship.'))
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
            })
            .catch(e => client.sendError(message, e))
        }
    }
}