module.exports.load = client => {
    client.commands['bounty'] = {
        settings : {
            type : 'game',
            description : 'All bot automation related commands',
            usage : `${client.settings.prefix}bounty add {user} {#}`
        },

        async run(message) {
            let args = message.content.split(' ').splice(1)
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            if(client.game.cooldowns.mining.includes(message.author.id)) return client.sendError(message, 'You are currently mining.')

            if(args[0] == 'add') {
                client.sendCheck(message, `You are about to set a bounty of \`${parseInt(args[2]).toLocaleString()}\` on ${args[1]}.`)
                const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
                collector.on('collect', message => {
                    if (message.content.toLowerCase() == 'yes') {
                        client.game.addBounty(message.author.id, args[1].replace(/[<@!>]/g, ''), parseInt(args[2]))
                        .then(() => message.reply('Successfully set bounty.'))
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