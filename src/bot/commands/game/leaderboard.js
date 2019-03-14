module.exports.load = client => {
    client.commands['leaderboard'] = {
        conf : {
            'name' : 'Leaderboard',
            'type' : 2,
            'description' : 'Fetch a leaderboard of the top players based on colony count.',
            'usage' : `${client.settings.prefix}leaderboard`
        },

        run(message) {
            client.load_user_data('*', data => {
                data.toArray()
                .then(async r => {
                    let leaderboard = []
                    await r.forEach(doc => {
                        leaderboard.push(`${doc.id}|${doc.colonies.length}`)
                    })
                    await leaderboard.sort((a, b) => {
                        a = a.split('|').splice(1).join('')
                        b = b.split('|').splice(1).join('')
                        return b - a
                    })
                    leaderboard.length = client.settings.game.leaderboard_length
                    let output = []
                    let i = 1
                    await leaderboard.forEach(e => {
                        client.fetchUser(e.split('|')[0], true)
                        .then(u => {
                            output.push(`${i}.) \`${u.username}#${u.discriminator} - ${e.split('|')[1].toLocaleString()}\``)
                            i++
                        })
                    })
                    let embed = new client.discord.RichEmbed()
                    .setTitle('Leaderboard')
                    .setDescription(`**${message.author.username}**, Here are the top \`${client.settings.game.leaderboard_length}\` players.\n${output.join('\n')}`)
                    .setTimestamp()
                    .setColor(client.settings.embed_color)
                    message.channel.send(embed)
                })
            })
        }
    }
}