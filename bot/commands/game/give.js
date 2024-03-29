module.exports.load = client => {
    client.commands['give'] = {
        settings : {
            type : 'game',
            description : 'Give another user credits.',
            usage : `${client.settings.prefix}give {user} {#}`
        },

        async run(message) {
            let args = message.content.split(' ').splice(1)
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            if(client.game.cooldowns.mining.includes(message.author.id)) return client.sendError(message, 'You are currently mining.')

            client.sendCheck(message, `You are about to give \`${parseInt(args[1]).toLocaleString()}\` credits to ${args[0]}.`)
            const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
            collector.on('collect', message => {
                if (message.content.toLowerCase() == 'yes') {
                    client.game.giveCredits(message.author.id, args[0].replace(/[<@!>]/g, ''), parseInt(args[1]))
                    .then(() => message.reply('Successfully gave user the credits.'))
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