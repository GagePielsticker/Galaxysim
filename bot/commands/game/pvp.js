module.exports.load = client => {
    client.commands['pvp'] = {
        settings : {
            type : 'game',
            description : 'PvP commands.',
            usage : `${client.settings.prefix}pvp scan {#}\n${client.settings.prefix}pvp attack {user}`
        },

        async run(message) {
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            if(client.game.cooldowns.warp.includes(message.author.id)) return client.sendError(message, 'You are currently warping.')

            let args = message.content.split(" ").slice(1)
            if(args[0].toLowerCase() == "scan"){
                args = args.slice(1)
                if(!args[0]) args[0] = 1
                client.sendCheck(message, `You are about to scan the system for other users`)
                const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
                collector.on('collect', async message => {
                    if (message.content.toLowerCase() == 'yes') {
                        client.game.pvpScan(message.author.id, parseInt(args[0])).then((players) => {
                            message.channel.send(`Players in your system \`\`\`${players.join('\n')}\`\`\``)
                        }).catch(e => client.sendError(message, e))
                        client.game.cooldowns.collector.splice(client.game.cooldowns.collector.indexOf(message.author.id), 1)
                        collector.stop()
                    }
                    if (message.content.toLowerCase() == 'no') {
                        client.sendError(message, 'Action cancelled.')
                        client.game.cooldowns.collector.splice(client.game.cooldowns.collector.indexOf(message.author.id), 1)
                        collector.stop()
                    }
                })
            }else if(args[0].toLowerCase() == "attack"){
                args = args.slice(1)
                if(!args[0]) return client.sendError(message, "No user given")
                let target = null
                await client.users.fetch(args[0])
                .then(u => target = u.id)
                .catch(e => e)
                if(!target){
                  try{
                      target = await client.users.find(u => u.tag.toLowerCase() == args[0].toLowerCase())
                      target = await target.id
                  }catch(e){}
                }
                if(!target && message.mentions.members && message.mentions.members.first()){
                    target = message.mentions.members.first().id
                }
                if(await !target) return client.sendError(message, "Invalid user, use a mention, id or tag")
                client.sendCheck(message, `You are about to attack ${client.users.get(target).tag}`)
                const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
                collector.on('collect', async message => {
                    if (message.content.toLowerCase() == 'yes') {
                        client.game.pvpAttack(message.author.id, target).then((response) => {
                            message.channel.send(response)
                        }).catch(e => client.sendError(message, e))
                        client.game.cooldowns.collector.splice(client.game.cooldowns.collector.indexOf(message.author.id), 1)
                        collector.stop()
                    }
                    if (message.content.toLowerCase() == 'no') {
                        client.sendError(message, 'Action cancelled.')
                        client.game.cooldowns.collector.splice(client.game.cooldowns.collector.indexOf(message.author.id), 1)
                        collector.stop()
                    }
                })
            }
        }
    }
}