module.exports.load = client => {
    client.commands['upgrade'] = {
        conf : {
            'name' : 'Upgrade',
            'type' : 2,
            'description' : 'Upgrade your ship systems.',
            'usage' : `${client.settings.prefix}upgrade mining\n${client.settings.prefix}upgrade warp\n${client.settings.prefix}upgrade fuel`
        },

        run(message) {
            client.load_user_data(message.author.id, res => {
                let args = message.content.split(' ').splice(1)
                if(client.cooldowns.collector.includes(message.author.id)) return client.send_error(message, 'Please answer the current prompt.')

                if(args[0] == 'mining'){
                    let price = res.ship.mining_speed * client.settings.game.mining_upgrade_cost
                    if(res.credits - price < 0) return client.send_error(message, `You aren\'t able to afford this upgrade. This will cost you \`${price}\` credits.`)
                    if(res.ship.mining_speed + client.settings.game.mining_upgrade_amount > res.ship.max_mining_speed) return client.send_error(message, `Your ship type \`${res.ship.type}\` cant fit any more mining upgrades.`)
                    vericheck('mining', price)
                    client.cooldowns.collector.push(message.author.id)
                    setTimeout(() => {
                        client.cooldowns.collector.splice(client.cooldowns.collector.indexOf(message.author.id), 1)
                    }, client.settings.collector_timeout * 1000)
                    const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collector_timeout * 1000 })
                    collector.on('collect', message => {
                        if (message.content.toLowerCase() == `yes`) {
                            message.reply('You have successfully upgraded your ship.')
                            res.credits -= price
                            res.ship.mining_speed += client.settings.game.mining_upgrade_amount
                            client.write_user_data(message.author.id, res)
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

                if(args[0] == 'warp'){
                    let price = res.ship.warp_speed * client.settings.game.warp_upgrade_cost
                    if(res.credits - price < 0) return client.send_error(message, `You aren\'t able to afford this upgrade. This will cost you \`${price}\` credits.`)
                    if(res.ship.warp_speed + client.settings.game.warp_upgrade_amount > res.ship.max_warp_speed) return client.send_error(message, `Your ship type \`${res.ship.type}\` cant fit any more warp upgrades.`)
                    vericheck('warp drive', price)
                    client.cooldowns.collector.push(message.author.id)
                    setTimeout(() => {
                        client.cooldowns.collector.splice(client.cooldowns.collector.indexOf(message.author.id), 1)
                    }, client.settings.collector_timeout * 1000)
                    const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collector_timeout * 1000 })
                    collector.on('collect', message => {
                        if (message.content.toLowerCase() == `yes`) {
                            message.reply('You have successfully upgraded your ship.')
                            res.credits -= price
                            res.ship.warp_speed += client.settings.game.warp_upgrade_amount
                            client.write_user_data(message.author.id, res)
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

                if(args[0] == 'fuel'){
                    let p1 = Math.floor(res.ship.max_fuel - 100)
                    let p2 = p1 / client.settings.game.fuel_upgrade_amount
                    let price = p2 * client.settings.game.fuel_upgrade_cost
                    
                    if(res.credits - price < 0) return client.send_error(message, `You aren\'t able to afford this upgrade. This will cost you \`${price}\` credits.`)
                    vericheck('fuel bay', price)
                    client.cooldowns.collector.push(message.author.id)
                    setTimeout(() => {
                        client.cooldowns.collector.splice(client.cooldowns.collector.indexOf(message.author.id), 1)
                    }, client.settings.collector_timeout * 1000)
                    const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collector_timeout * 1000 })
                    collector.on('collect', message => {
                        if (message.content.toLowerCase() == `yes`) {
                            message.reply('You have successfully upgraded your ship.')
                            res.credits -= price
                            res.ship.max_fuel += client.settings.game.fuel_upgrade_amount
                            client.write_user_data(message.author.id, res)
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

                function vericheck(item, amount) {
                    let embed = new client.discord.RichEmbed()
                    .setTitle('Upgrade')
                    .setDescription(`**${message.author.username}**, you are about to upgrade \`${item}\` for \`${amount}\` credits, are you sure?.\nRespond with \`yes\` or \`no\`.`)
                    .setTimestamp()
                    .setColor(client.settings.embed_color)
                    message.channel.send(embed)
                }

            })
        }
    }
}