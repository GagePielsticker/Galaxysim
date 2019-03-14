module.exports.load = client => {
    client.commands['warp'] = {
        conf : {
            'name' : 'Warp',
            'type' : 2,
            'description' : `Warp your ship to a diffrent system.\nLIMITATIONS\nX:${client.settings.game.min_x} -> ${client.settings.game.max_x} | Y: ${client.settings.game.min_y} -> ${client.settings.game.max_y}`,
            'usage' : `${client.settings.prefix}warp {x} {y}`
        },

        run(message) {
            client.load_user_data(message.author.id, async res => {
                let args = message.content.split(' ').splice(1)
                if(!Number.isInteger(parseInt(args[0])) || !Number.isInteger(parseInt(args[1]))) return client.send_error(message, 'Invalid location.')
                let target_x = Math.floor(parseInt(args[0]))
                let target_y = Math.floor(parseInt(args[1]))
                let distance_from_target = Math.floor(distance(res.x_pos, res.y_pos, target_x, target_y))
                let travel_time = distance_from_target * client.settings.game.warp_time_multiplier / res.ship.warp_speed
                let fuel_used = Math.floor(distance_from_target)
                
                if(target_x > client.settings.game.max_x || target_x < client.settings.game.min_x) return client.send_error(message, 'Target outside of boundries.')
                if(target_y > client.settings.game.max_y || target_y < client.settings.game.min_y) return client.send_error(message, 'Target outside of boundries.')
                if(res.ship.fuel - fuel_used < 0) return client.send_error(message, `You do not have enough fuel, this would use \`${fuel_used}\` fuel blocks.`)
                if(client.cooldowns.collector.includes(message.author.id)) return client.send_error(message, 'Please answer the current prompt.')
                if(client.cooldowns.action.includes(message.author.id)) return client.send_error(message, 'You are currently performing an action.')
            
                let embed = new client.discord.RichEmbed()
                .setTitle('Warp')
                .setDescription(`**${message.author.username}**, you are about to warp to X:\`${target_x}\` Y:\`${target_y}\` which will take \`${client.humanize(travel_time * 1000)}\` and use \`${fuel_used}\` fuel blocks.\nRespond with \`yes\` or \`no\`.`)
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
                        client.cooldowns.action.push(message.author.id)
                        embed.setDescription(`**${message.author.username}**, you have entered warp speed for \`${travel_time}\` seconds!`)
                        message.channel.send(embed)
                        
                        //if star system dosnt exist create it
                        client.load_system_data(target_x, target_y, restwo => {
                            if(restwo == null) client.create_system(target_x, target_y)
                        })

                        setTimeout(() => {
                            res.x_pos = target_x
                            res.y_pos = target_y
                            res.ship.fuel -= fuel_used
                            client.write_user_data(message.author.id, res)
                            client.cooldowns.action.splice(client.cooldowns.action.indexOf(message.author.id), 1)
                            message.reply(`You have successfully warped!`)
                        }, travel_time * 1000)
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

            function distance(x1, y1, x2, y2) {
                return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
            }
        }
    }
}