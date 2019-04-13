module.exports.load = client => {
    client.commands['deposit'] = {
        settings : {
            type : 'game'
        },

        async run(message) {
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            if(client.game.cooldowns.warp.includes(message.author.id)) return client.sendError(message, 'You are currently warping.')
            if(client.game.cooldowns.mining.includes(message.author.id)) return client.sendError(message, 'You are currently mining.')
            if(client.game.cooldowns.processing.includes(message.author.id)) return client.sendError(message, 'You are currently processing ore.')
            let args = message.content.split(' ').splice(1)

            if(args[0] == 'ore'){
                if(!args[2]) args[2] = 'all'
                client.sendCheck(message, `You are about to deposit \`${args[2]}\` ore into the \`${args[1]}\`.`)
                const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
                collector.on('collect', message => {
                    if (message.content.toLowerCase() == 'yes') {
                        client.game.depositOres(message.author.id, args[1], parseInt(args[2]))
                        .then(() => message.reply('Successfully deposited ore.'))
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