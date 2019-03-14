module.exports.load = client => {
    client.commands['pvp'] = {
        conf : {
            'name' : 'Pvp',
            'type' : 2,
            'description' : 'All pvp commands listed below.',
            'usage' : `${client.settings.prefix}pvp scan`
        },

        run(message) {
            if(client.cooldowns.collector.includes(message.author.id)) return client.send_error(message, 'Please answer the current prompt.')
            if(client.cooldowns.action.includes(message.author.id)) return client.send_error(message, 'You are currently performing an action.')

            let args = message.content.split(' ').splice(1)
            client.load_user_data(message.author.id, user_res => {

                if(args[0] == 'scan'){
                    let ships_in_system_id = []
                    client.load_user_data('*', all_res => {
                        all_res.forEach(doc => {
                            if(doc.x_pos == user_res.x_pos && doc.y_pos == user_res.y_pos) {
                                client.fetchUser(doc.id, true)
                                .then(u =>{
                                    ships_in_system_id.push(`${u.username}#${u.discriminator}`)
                                })
                            }
                        })
                    })
                    
                    let scan_time = Math.floor(ships_in_system_id.length * client.settings.game.pvp_scan_time / user_res.ship.scanner_strength)

                    let embed = new client.discord.RichEmbed()
                    .setTitle('Scan')
                    .setDescription(`**${message.author.username}**, you are about to pvp scan X:\`${user_res.x_pos}\` Y:\`${user_res.y_pos}\` which will take \`${scan_time}\` seconds.\nRespond with \`yes\` or \`no\`.`)
                    .setTimestamp()
                    .setColor(client.settings.embed_color)
                    message.channel.send(embed)

                    client.cooldowns.collector.push(message.author.id)
                    setTimeout(() => {
                        client.cooldowns.collector.splice(client.cooldowns.collector.indexOf(message.author.id), 1)
                    }, client.settings.collector_timeout * 1000)

                    const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collector_timeout * 1000 })
                    collector.on('collect', message => {
                        if (message.content.toLowerCase() == `yes`) {
                            client.cooldowns.action.push(message.author.id)
                            embed.setDescription(`**${message.author.username}**, you started scanning for \`${scan_time}\` seconds!`)
                            message.channel.send(embed)

                            setTimeout(() => {
                                let embed = new client.discord.RichEmbed()
                                .setTitle('Scan')
                                .setDescription(`**${message.author.username}**, your scan has finished, here are the results. \`\`\`${ships_in_system_id.join(' | ')}\`\`\``)
                                .setTimestamp()
                                .setColor(client.settings.embed_color)
                                message.channel.send(embed)
                                client.cooldowns.action.splice(client.cooldowns.action.indexOf(message.author.id), 1)
                            }, scan_time * 1000)

                            client.cooldowns.collector.splice(client.cooldowns.collector.indexOf(message.author.id), 1)
                            collector.stop()
                        }
                        if (message.content.toLowerCase() == `no`) {
                            client.send_error(message, 'Action cancelled.')
                            client.cooldowns.collector.splice(client.cooldowns.collector.indexOf(message.author.id), 1)
                            collector.stop()
                        }
                    })

                } 

            })
        }
    }
}