module.exports.load = client => {
    client.commands['mine'] = {
        settings : {
            type : 'game'
        },

        async run(message) {
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            if(client.game.cooldowns.warp.includes(message.author.id)) return client.sendError(message, 'You are currently warping.')
            if(client.game.cooldowns.mining.includes(message.author.id)) return client.sendError(message, 'You are currently mining.')
            if(client.game.cooldowns.processing.includes(message.author.id)) return client.sendError(message, 'You are currently processing ore.')
            client.game.mineSystem(message.author.id)
            .then(async (mineInfo) => {
                let initEmbed = new client.discord.MessageEmbed()
                initEmbed.setTitle('Mine')
                initEmbed.setDescription(`Activating mining lasers...`)
                initEmbed.setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                initEmbed.setTimestamp()
                initEmbed.setColor(client.settings.embedColor)
                let init = await message.channel.send(initEmbed)
                setTimeout(() => {
                    init.delete()
                    let finalEmbed = new client.discord.MessageEmbed()
                    finalEmbed.setTitle('Mine')
                    finalEmbed.setDescription(`You mined \`${mineInfo.toLocaleString()}\` asteroids.`)
                    finalEmbed.setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                    finalEmbed.setTimestamp()
                    finalEmbed.setColor(client.settings.embedColor)
                    message.channel.send(finalEmbed)
                }, client.settings.game.miningCooldown * 1000)
            })
            .catch(e => client.sendError(message, e))
        }
    }
}