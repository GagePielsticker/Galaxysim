module.exports.load = client => {
    client.commands['stats'] = {
        settings : {
            type : 'general',
            description : 'Get bot statistics.',
            usage : `${client.settings.prefix}stats`
        },

        async run(message) {
            let embed = new client.discord.MessageEmbed()
            .setTitle('Statistics')
            .setDescription(client.settings.botDescription)
            .addField('Users', `\`${client.users.size}\``, true)
            .addField('Guilds', `\`${client.guilds.size}\``, true)
            .addField('Language', '\`NodeJS\`', true)
            .addField('Support Server', `[Click Here](${client.settings.supportServer})`, true)
            .addField('Website', `[Click Here](${client.settings.websiteURL})`, true)
            .addField('Github', `[Click Here](${client.settings.githubURL})`, true)
            .addField('Developer', `uber#0001`, true)
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
            .setTimestamp()
            .setColor(client.settings.embedColor)
            message.channel.send(embed)
        }
    }
}