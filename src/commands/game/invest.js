module.exports.load = client => {
    client.commands['invest'] = {
        settings : {
            type : 'game'
        },

        async run(message) {
            let args = message.content.split(' ').splice(1)
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            if(args.length != 2) return client.sendError(message, 'Invalid usage.')
            let colony = args[0]
            let amount = parseInt(args[1])
            client.sendCheck(message, `Are you sure you want to invest \`${amount.toLocaleString()}\` credits into \`${colony}\`?`)
            const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
            collector.on('collect', message => {
                if (message.content.toLowerCase() == 'yes') {
                    client.game.investToColony(message.author.id, colony, amount)
                    .then(() => {
                        let embed = new client.discord.MessageEmbed()
                        embed.setTitle('Invest')
                        embed.setDescription(`Successfully invested money.`)
                        embed.setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                        embed.setTimestamp()
                        embed.setColor(client.settings.embedColor)
                        message.reply(embed)
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