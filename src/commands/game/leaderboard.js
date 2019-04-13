module.exports.load = client => {
    client.commands['leaderboard'] = {
        settings : {
            type : 'game'
        },

        async run(message) {
            let args = message.content.split(' ').splice(1)
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            if(!args[2]) args[2] = 1
            if(args[0] == 'user') {
                client.game.getUserLeaderboard(parseInt(args[2]), args[1])
                .then(leaderboard => {
                    message.channel.send(`Top users page \`${args[2]}\` \`\`\`${leaderboard.join('\n')}\`\`\``)
                })
                .catch(e => client.sendError(message, e))
            }
            if(args[0] == 'alliance') {
                client.game.getAllianceLeaderboard(parseInt(args[2]), args[1])
                .then(leaderboard => {
                    message.channel.send(`Top alliances page \`${args[2]}\` \`\`\`${leaderboard.join('\n')}\`\`\``)
                })
                .catch(e => client.sendError(message, e))
            }
        }
    }
}