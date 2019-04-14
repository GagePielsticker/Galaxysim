module.exports.load = client => {
    client.commands['colony'] = {
        settings : {
            type : 'game',
            description : 'Shows a specific colony.',
            usage : `${client.settings.prefix}colony {name}`
        },

        async run(message) {
            let args = message.content.split(' ').splice(1)

            client.game.getColony(message.author.id, args[1])
            .then(colony => {
                let embed = new client.discord.MessageEmbed()
                .setTitle('Colony')
                .setDescription(`Here is a view of your \`${colony.name}\` colony.`)
                .addField('Population', `\`${colony.population}\``)
                .addField('Resources', `\`${colony.resources}\``)
                .addField('Wallet', `\`${colony.wallet}\``)
                .addField('Ore Storage', `\`${colony.oreStorage}\``)
                .setTimestamp()
                .setColor(client.settings.embedColor)
                message.channel.send(embed)
            })
            .catch(e => client.sendError(message, e))
        }
    }
}