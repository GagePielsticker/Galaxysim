module.exports.load = client => {

    let dev_array = []
    client.settings.developers.forEach(dev => {
        client.fetchUser(dev, true)
        .then(u => {
            dev_array.push(`\`${u.username}#${u.discriminator}\``)
        })
    })

    client.commands['stats'] = {

        conf : {
            'name' : 'Stats',
            'type' : 1,
            'description' : 'Shows bot information.',
            'usage' : `${client.settings.prefix}stats`
        },

        run(message) {
            let embed = new client.discord.RichEmbed()
            .setTitle('Statistics')
            .setDescription(client.settings.bot_description)
            .addField('Users', `\`${client.users.size}\``, true)
            .addField('Guilds', `\`${client.guilds.size}\``, true)
            .addField('Language', '\`NodeJS\`', true)
            .addField('Support Server', `[Click Here](${client.settings.support_server_url})`, true)
            .addField('Website', `[Click Here](${client.settings.website_url})`, true)
            .addField('Developers', `${dev_array.join('\n')}`, true)
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
            .setTimestamp()
            .setColor(client.settings.embed_color)
            message.channel.send(embed)
        }
    }
}