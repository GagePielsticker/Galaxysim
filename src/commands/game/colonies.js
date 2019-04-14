module.exports.load = client => {
    client.commands['colonies'] = {
        settings : {
            type : 'game',
            description : 'See all your colonies.',
            usage : `${client.settings.prefix}colonies {#}`
        },

        async run(message) {
            let args = message.content.split(' ').splice(1)
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            if(!args[0]) args[0] = 1
            client.game.getUserColonies(message.author.id, parseInt(args[0]))
            .then(colonies => {
                let result = []
                colonies.forEach(colony => {
                    result.push(`${colony.name} | ${colony.xPos},${colony.yPos}\nC:${colony.wallet}|P:${colony.population}`)
                })
                message.channel.send(`Here is a list of your colonies. Page \`${args[0]}\`\n\`\`\`${result.join('\n-----------\n')}\`\`\`\`c\` = investments; \`p\` = population;`)
            })
            .catch(e => client.sendError(message, e))

        }
    }
}