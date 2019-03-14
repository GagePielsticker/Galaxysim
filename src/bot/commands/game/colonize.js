module.exports.load = client => {
    client.commands['colonize'] = {
        conf : {
            'name' : 'Colonize',
            'type' : 2,
            'description' : 'Colonize a specific planet. You can find planet id\'s by scanning your current system.',
            'usage' : `${client.settings.prefix}colonize {planet id}`
        },

        run(message) {
            client.load_user_data(message.author.id, async user_res => {
                client.load_system_data(user_res.x_pos, user_res.y_pos, sys_res => {
                    if(client.cooldowns.collector.includes(message.author.id)) return client.send_error(message, 'Please answer the current prompt.')
                    if(client.cooldowns.action.includes(message.author.id)) return client.send_error(message, 'You are currently performing an action.')
                    let args = message.content.split(' ').splice(1)

                    let colony_cost_a = user_res.colonies.length * 3
                    let colony_cost_ab = user_res.colonies.length + 1
                    let colony_cost_b = Math.pow(user_res.colonies.length, colony_cost_a / colony_cost_ab)
                    let colony_cost = Math.floor(client.settings.game.colony_base_cost * colony_cost_b)
                    
                    let p_pos = null
                    for(planet in sys_res.planets){
                        if(sys_res.planets[planet].name == args[0]){
                            p_pos = planet
                        }
                    }
                    if(p_pos == null) return client.send_error(message, 'There is no planet in this system with that id.')
                    if(user_res.credits - colony_cost < 0) return client.send_error(message, `You can\'t afford this colony, it would cost \`${colony_cost.toLocaleString()}\` credits.`)
                    if(sys_res.planets[p_pos].owner != null) return client.send_error(message, 'This planet is already owned.')
                    let embed = new client.discord.RichEmbed()
                    .setTitle('Colonize')
                    .setDescription(`**${message.author.username}**, you are about to colonize \`${args[0]}\` which will cost \`${colony_cost.toLocaleString()}\` credits.\nRespond with \`yes\` or \`no\`.`)
                    .setTimestamp()
                    .setColor(client.settings.embed_color)
                    message.channel.send(embed)
                    .catch(e => client.log(`Error sending message to ${message.author.username}#${message.author.discriminator}.`))
                    
                    client.cooldowns.collector.push(message.author.id)
                    setTimeout(() => {
                        client.cooldowns.collector.splice(client.cooldowns.collector.indexOf(message.author.id), 1)
                    }, client.settings.collector_timeout * 1000)
                    
                    const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collector_timeout * 1000 })
                    collector.on('collect', message => {
                        if (message.content.toLowerCase() == `yes`) {

                            sys_res.planets[p_pos].owner = message.author.id
                            sys_res.planets[p_pos].population = client.settings.game.colonize_init_population
                            sys_res.planets[p_pos].investments = client.settings.game.colonize_init_investment
                            user_res.credits -= colony_cost
                            user_res.colonies.push(sys_res.planets[p_pos])

                            message.reply('You have successfully colonized this planet!')
                            .catch(e => client.log(`Error sending message to ${message.author.username}#${message.author.discriminator}.`))
        
                            client.write_user_data(message.author.id, user_res)
                            client.write_system_data(user_res.x_pos, user_res.y_pos, sys_res)
                            client.cooldowns.collector.splice(client.cooldowns.collector.indexOf(message.author.id), 1)
                            collector.stop()
                        }
                        if (message.content.toLowerCase() == `no`) {
                            client.send_error(message, 'Action cancelled.')
                            client.cooldowns.collector.splice(client.cooldowns.collector.indexOf(message.author.id), 1)
                            collector.stop()
                        }
                    })

                })
            })
        }
    }
}