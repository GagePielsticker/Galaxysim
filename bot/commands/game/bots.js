module.exports.load = client => {
    client.commands['bots'] = {
        settings : {
            type : 'game',
            description : 'All bot automation related commands',
            usage : `${client.settings.prefix}bots buy mining {#} {colony}`
        },

        async run(message) {
            let args = message.content.split(' ').splice(1)
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            if(args[0] == 'buy'){
                if(args[1] == 'mining'){
                    client.sendCheck(message, `Are you sure you want to buy \`${args[2]}\` bots costing \`${parseInt(args[2]) * client.settings.game.miningBotCost}\` credits?` )
                    const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
                    collector.on('collect', message => {
                        if (message.content.toLowerCase() == 'yes') {
                            client.game.buyMiningBot(message.author.id, args[3], parseInt(args[2]))
                            .then(() => message.reply('Successfully bought bots.'))
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
}