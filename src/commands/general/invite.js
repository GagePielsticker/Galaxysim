module.exports.load = client => {
    client.commands['invite'] = {
        settings : {
            type : 'general',
            description : 'Get invite url for bot.',
            usage : `${client.settings.prefix}invite`
        },

        async run(message) {
            message.channel.send(`You can invite me to your server here, ${client.settings.inviteURL}`)
        }
    }
}