module.exports.load = client => {
    client.commands['invite'] = {
        settings : {
            type : 'general'
        },

        async run(message) {
            message.channel.send(`You can invite me to your server here, ${client.settings.inviteURL}`)
        }
    }
}