module.exports.load = client => {
    client.commands['pos'] = {
        conf : {
            'name' : 'Position',
            'type' : 2,
            'description' : 'Quick-View your position information.',
            'usage' : `${client.settings.prefix}pos`
        },

        run(message) {
            client.load_user_data(message.author.id, async res => {
                message.channel.send(`You are currently at \`${res.x_pos}\`/\`${res.y_pos}\`.`)
                .catch(e => client.log(`Error sending message to ${message.author.username}#${message.author.discriminator}.`))
            })
        }
    }
}