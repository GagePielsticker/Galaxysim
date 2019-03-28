module.exports.load = client => {
    client.commands['pvp'] = {
        conf : {
            'name' : 'Pvp',
            'type' : 2,
            'description' : 'All pvp commands listed below.',
            'usage' : `${client.settings.prefix}pvp scan\n${client.settings.prefix}pvp attack {@user}`
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
                                .setDescription(`**${message.author.username}**, your scan has finished, here are the results. \`\`\`${ships_in_system_id.join(' /--/ ')}\`\`\``)
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

                if(args[0] == 'attack'){
                    if(args.length != 2) return client.send_error(message, 'Invalid usage.')
                    if(client.cooldowns.pvp.includes(message.author.id)) return client.send_error(message, 'You are currently on pvp cooldown.')

                    let target = args[1].replace(/[<!@>]/g, '')
                    client.load_user_data(target, target_res => {
                        if(target_res == null) return client.send_error(message, 'User does not exist in database.')
                        if(target_res.x_pos != user_res.x_pos || target_res.y_pos != user_res.y_pos) return client.send_error(message, 'User not in your system.')
                        if(client.cooldowns.action.includes(target)) return client.send_error(message, 'They are currently invulnerable due to a warp or scan.')
                        let embed = new client.discord.RichEmbed()
                        .setTitle('PvP')
                        .setDescription(`**${message.author.username}**, you are about to attack <@${target}>. Are you sure?\nRespond with \`yes\` or \`no\`.`)
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

                                message.reply('You enter into a dogfight... (calculating)')
                                .then(m => {
                                    let result = client.chance.weighted([true, false], [user_res.ship.att, target_res.ship.def])
                                    setTimeout(() => {
                                        //necessary function
                                        function distance(x1, y1, x2, y2) {
                                            return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
                                        }

                                        if(result) {
                                            let profits = Math.floor(target_res.credits * client.settings.game.pvp_win_profit_percent)
                                            let pos = {
                                                x : null,
                                                y : null
                                            }
                                            let dist = 9999999999999
                                            target_res.colonies.forEach(col => {
                                                if(distance(target_res.x_pos, target_res.y_pos, col.x_pos, col.y_pos) < dist) {
                                                    dist = distance(target_res.x_pos, target_res.y_pos, col.x_pos, col.y_pos)
                                                    pos.x = col.x_pos
                                                    pos.y = col.y_pos
                                                }
                                            })
                                            if(pos.x == null || pos.y == null) {
                                                pos.x = target_res.x_pos + 20
                                                pos.y = target_res.y_pos + 15
                                            }

                                            //make target lose credits and respawn in closest colony and destroy ship
                                            target_res.credits -= profits
                                            target_res.ship = {
                                                type: client.settings.game.starting_ship_type,
                                                description: client.settings.game.starting_ship_description,
                                                warp_speed: client.settings.game.starting_ship_warp,
                                                max_warp_speed: client.settings.game.starting_ship_max_warp,
                                                mining_speed: client.settings.game.starting_ship_mining,
                                                max_mining_speed: client.settings.game.starting_ship_max_mining,
                                                scanner_strength: client.settings.game.starting_scanner_strength,
                                                max_scanner_strength: client.settings.game.starting_ship_max_scan,
                                                att: client.settings.game.starting_ship_att,
                                                def: client.settings.game.starting_ship_def,
                                                max_cargo: client.settings.game.starting_max_cargo,
                                                max_fuel: 100,
                                                fuel: 100,
                                                cargo: [],
                                            }
                                            target_res.x_pos = pos.x
                                            target_res.y_pos = pos.y

                                            user_res.credits += profits

                                            let embed = new client.discord.RichEmbed()
                                            .setTitle('PvP')
                                            .setDescription(`**${message.author.username}**, you successfully attacked and destroyed <@${target}>'s ship. You were able to salvage \`${profits}\` credits from the wreckage.`)
                                            .setTimestamp()
                                            .setColor(client.settings.embed_color)
                                            m.edit(embed)
                                        }
        
                                        if(!result) {
                                            let profits = Math.floor(user_res.credits * client.settings.game.pvp_lose_profit_percent)
                                            let pos = {
                                                x : null,
                                                y : null
                                            }
                                            let dist = 9999999999999
                                            user_res.colonies.forEach(col => {
                                                if(distance(user_res.x_pos, user_res.y_pos, col.x_pos, col.y_pos) < dist) {
                                                    dist = distance(user_res.x_pos, user_res.y_pos, col.x_pos, col.y_pos)
                                                    pos.x = col.x_pos
                                                    pos.y = col.y_pos
                                                }
                                            })
                                            if(pos.x == null || pos.y == null) {
                                                pos.x = user_res.x_pos + 20
                                                pos.y = user_res.y_pos + 15
                                            }

                                            //make target lose credits and respawn in closest colony and destroy ship
                                            user_res.credits -= profits
                                            user_res.ship = {
                                                type: client.settings.game.starting_ship_type,
                                                description: client.settings.game.starting_ship_description,
                                                warp_speed: client.settings.game.starting_ship_warp,
                                                max_warp_speed: client.settings.game.starting_ship_max_warp,
                                                mining_speed: client.settings.game.starting_ship_mining,
                                                max_mining_speed: client.settings.game.starting_ship_max_mining,
                                                scanner_strength: client.settings.game.starting_scanner_strength,
                                                max_scanner_strength: client.settings.game.starting_ship_max_scan,
                                                att: client.settings.game.starting_ship_att,
                                                def: client.settings.game.starting_ship_def,
                                                max_cargo: client.settings.game.starting_max_cargo,
                                                max_fuel: 100,
                                                fuel: 100,
                                                cargo: [],
                                            }
                                            user_res.x_pos = pos.x
                                            user_res.y_pos = pos.y

                                            target_res.credits += profits
                                            
                                            let embed = new client.discord.RichEmbed()
                                            .setTitle('PvP')
                                            .setDescription(`**${message.author.username}**, you unsuccessfully attacked and were destroyed by <@${target}>'s ship. You lost \`${profits}\` credits from the wreckage.`)
                                            .setTimestamp()
                                            .setColor(client.settings.embed_color)
                                            m.edit(embed)
                                        }

                                        client.write_user_data(message.author.id, user_res)
                                        client.write_user_data(target, target_res)

                                    }, client.settings.pvp_time * 1000)
                                })

                                client.cooldowns.pvp.push(message.author.id)
                                setTimeout(() => {
                                    client.cooldowns.pvp.splice(client.cooldowns.pvp.indexOf(message.author.id), 1)
                                }, client.settings.pvp_cooldown * 1000)
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
                }
            })
        }
    }
}