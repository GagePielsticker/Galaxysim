module.exports.load = client => {
    client.commands['pos'] = {
        settings : {
            type : 'game',
            description : 'Quick positional information.',
            usage : `${client.settings.prefix}pos`
        },

        async run(message) {
            let user = await client.db.collection('users').findOne({id:message.author.id})
            let embed = await new client.discord.MessageEmbed()
            embed.setTitle('Position')
            embed.setDescription(`X:\`${user.xPos}\` | Y:\`${user.yPos}\``)
            embed.setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
            embed.setTimestamp()
            embed.setColor(client.settings.embedColor)
            await message.channel.send(embed)
        }
    }
}