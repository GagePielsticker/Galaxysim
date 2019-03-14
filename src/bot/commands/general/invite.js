module.exports.load = client => {
    client.commands['invite'] = {
        conf : {
            'name' : 'Invite',
            'type' : 1,
            'description' : 'Gives invite link for bot.',
            'usage' : `${client.settings.prefix}invite`
        },

        run(message) {
            message.channel.send(`You can invite me to your server here, ${client.settings.invite_url}`)
        }
    }
}