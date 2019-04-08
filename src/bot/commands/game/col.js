module.exports.load = client => {
    client.commands['col'] = {
        conf : {
            'name' : 'Colony Lookup',
            'type' : 2,
            'description' : 'Show all stats of a colony.',
            'usage' : `${client.settings.prefix}col {colony-id}`
        },

        run(message) {
            let args = message.content.split(' ').splice(1)
            if(args.length != 1) return client.send_error(message, 'Invalid Usage')
            client.user_colony(args[0], message.author.id)
            .then(colony => {
                let p1 = colony.population / 3
                let p2 = p1 * colony.resources
                let profit = Math.floor(p2 / 30)
                let embed = new client.discord.RichEmbed()
                .setTitle('Colony Lookup')
                .setDescription(`Here is all your info for colony \`${colony.name}\``)
                .addField(`Investments`, `\`${colony.investments.toLocaleString()}\``, true)
                .addField(`Population`, `\`${colony.population.toLocaleString()}\``, true)
                .addField(`Position`, `\`${colony.x_pos}|${colony.y_pos}\``, true)
                .addField(`Available Resources`, `\`${colony.resources}\``, true)
                .addField(`Passive Income`, `\`${profit}\` credits`, true)
                .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                .setTimestamp()
                .setColor(client.settings.embed_color)
                message.channel.send(embed)  
            })
            .catch(e => client.send_error(message, e))
        }
    }
}