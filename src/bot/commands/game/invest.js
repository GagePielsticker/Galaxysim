module.exports.load = client => {
    client.commands['invest'] = {
        conf : {
            'name' : 'Invest',
            'type' : 2,
            'description' : 'Invest money into a colony to help it grow faster and generate more credits.',
            'usage' : `${client.settings.prefix}invest {planet id} {amount}`
        },

        run(message) {
            client.load_user_data(message.author.id, user_res => {
                if(client.cooldowns.collector.includes(message.author.id)) return client.send_error(message, 'Please answer the current prompt.')
                if(client.cooldowns.action.includes(message.author.id)) return client.send_error(message, 'You are currently performing an action.')
                let args = message.content.split(' ').splice(1)
                let planet_user_pos = null
                let planet_sys_pos = null
                for(pl in user_res.colonies){
                    if(user_res.colonies[pl].name == args[0]){
                        planet_user_pos = pl
                    }
                }
                if(planet_user_pos == null) return client.send_error(message, 'You do not own this planet.')
                client.load_system_data(user_res.colonies[planet_user_pos].x_pos, user_res.colonies[planet_user_pos].y_pos, sys_res => {
                    for(pl in sys_res.planets){
                        if(sys_res.planets[pl].name == args[0]){
                            planet_sys_pos = pl
                        }
                    }
                    if(!Number.isInteger(parseInt(args[1]))) return client.send_error(message, 'Invalid investment amount.')
                    if(parseInt(args[1]) < 0) return client.send_error(message, 'Invalid investment amount.')
                    if(user_res.credits - parseInt(args[1]) < 0) return client.send_error(message, 'You cant afford this.')

                    let embed = new client.discord.RichEmbed()
                    .setTitle('Invest')
                    .setDescription(`**${message.author.username}**, you are about to invest \`${args[1]}\` into \`${args[0]}\`.\nRespond with \`yes\` or \`no\`.`)
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
                            user_res.credits -= parseInt(args[1])
                            user_res.colonies[planet_user_pos].investments += parseInt(args[1])
                            sys_res.planets[planet_sys_pos].investments += parseInt(args[1])
                            message.reply('You have successfully invested in the colony.')
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