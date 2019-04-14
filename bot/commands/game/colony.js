module.exports.load = client => {
    client.commands['colony'] = {
        settings : {
            type : 'game',
            description : 'Shows a specific colony.',
            usage : `${client.settings.prefix}colony {name}`
        },

        async run(message) {
            let args = message.content.split(' ').splice(1)

            client.game.getColony(message.author.id, args[0])
            .then(colony => {
                let embed = new client.discord.MessageEmbed()
                .setTitle('Colony')
                .setDescription(`Here is a view of your \`${colony.name}\` colony.`, true)
                .addField('Population', `\`${colony.population}\``, true)
                .addField('Resources', `\`${colony.resources}\``, true)
                .addField('Wallet', `\`${colony.wallet}\``, true)
                .addField('Ore Storage', `\`${colony.oreStorage}\``, true)
                .addField('Mining Bots', `\`${colony.miningBots}\``, true)
                .setTimestamp()
                .setColor(client.settings.embedColor)
                message.channel.send(embed)
            })
            .catch(e => client.sendError(message, e))
        }
    }
}