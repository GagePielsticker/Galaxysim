module.exports.load = client => {
    client.commands['scan'] = {
        conf : {
            'name' : 'Scan',
            'type' : 2,
            'description' : 'Scan your current system for planets.',
            'usage' : `${client.settings.prefix}scan`
        },

        run(message) {
            client.load_user_data(message.author.id, user_res => {
                client.load_system_data(user_res.x_pos, user_res.y_pos, sys_res => {
                    let scan_time = Math.floor(sys_res.planets.length * client.settings.game.planet_scan_time / user_res.ship.scanner_strength)

                    if(client.cooldowns.collector.includes(message.author.id)) return client.send_error(message, 'Please answer the current prompt.')
                    if(client.cooldowns.action.includes(message.author.id)) return client.send_error(message, 'You are currently performing an action.')

                    let embed = new client.discord.RichEmbed()
                        .setTitle('Scan')
                        .setDescription(`**${message.author.username}**, you are about to scan X:\`${user_res.x_pos}\` Y:\`${user_res.y_pos}\` which will take \`${scan_time}\` seconds.\nRespond with \`yes\` or \`no\`.`)
                        .setTimestamp()
                        .setColor(client.settings.embed_color)
                        message.channel.send(embed)
                        .catch(e => client.log(`Error sending message to ${message.author.username}#${message.author.discriminator}.`))

                    let finished_scan = new client.discord.RichEmbed()
                        .setTitle('Scan Results')
                        .setDescription(`Your scan has finished!`)
                        .addField('System Name', `\`${sys_res.name}\``, true)
                        .addField('Controlling Alliance', `\`${sys_res.controlling_alliance}\``, true)
                        .addField('Location (X|Y)', `\`${sys_res.x_pos}\`|\`${sys_res.y_pos}\``, true)
                        .addField('asteroids', `\`${sys_res.astroids}\``)
                        .setTimestamp()
                        .setColor(client.settings.embed_color)
                        sys_res.planets.map(planet => {
                            if(planet.owner != null){
                                client.fetchUser(planet.owner, true)
                                .then(u => {
                                    finished_scan.addField(`${planet.name}`, `Resources: \`${planet.resources}\`\nPopulation: \`${planet.population}\`\nOwner: \`${u.username}#${u.discriminator}\``, true)
                                })
                            }
                            if(planet.owner == null) finished_scan.addField(`${planet.name}`, `Resources: \`${planet.resources}\`\nPopulation: \`${planet.population}\`\nOwner: \`None\``, true)
                        })
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
                                message.reply(finished_scan)
                                .catch(e => client.log(`Error sending message to ${message.author.username}#${message.author.discriminator}.`))
                                
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
                })
            })
        }
    }
}