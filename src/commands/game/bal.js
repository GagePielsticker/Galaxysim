module.exports.load = client => {
    client.commands['bal'] = {
        settings : {
            type : 'game',
            description : 'Quick info on balance.',
            usage : `${client.settings.prefix}bal`
        },

        async run(message) {
            let user = await client.db.collection('users').findOne({id:message.author.id})
            let embed = await new client.discord.MessageEmbed()
            embed.setTitle('Balance')
            embed.setDescription(`\`${user.credits.toLocaleString()}\` credits`)
            embed.setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
            embed.setTimestamp()
            embed.setColor(client.settings.embedColor)
            await message.channel.send(embed)
        }
    }
}