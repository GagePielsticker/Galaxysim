module.exports.load = client => {
    client.commands['bal'] = {
        conf : {
            'name' : 'Balance',
            'type' : 2,
            'description' : 'Quick-View your balance information.',
            'usage' : `${client.settings.prefix}bal`
        },

        run(message) {
            client.load_user_data(message.author.id, res => {
                message.channel.send(`You currently have \`${res.credits.toLocaleString()}\` credits.`)
                .catch(e => client.log(`Error sending message to ${message.author.username}#${message.author.discriminator}.`))
            })
        }
    }
}