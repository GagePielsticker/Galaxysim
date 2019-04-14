module.exports.load = client => {
    client.commands['ally'] = {
        settings : {
            type : 'game',
            description : 'Contains all alliance based commands.',
            usage : `----Alliance Members----\n${client.settings.prefix}ally create {name}\n${client.settings.prefix}ally join {name}\n${client.settings.prefix}ally leave\n${client.settings.prefix}ally stats\n${client.settings.prefix}ally members\n${client.settings.prefix}ally invest {amount}\n----Alliance Owners----\n${client.settings.prefix}ally apps list {#}\n${client.settings.prefix}ally apps accept {#}\n${client.settings.prefix}ally apps deny {#}\n${client.settings.prefix}ally disband\n${client.settings.prefix}ally kick {user}\n${client.settings.prefix}ally set description {string}\n${client.settings.prefix}ally set tax {%}\n${client.settings.prefix}ally set home {x} {y}`
        },

        async run(message) {
            let args = message.content.split(' ').splice(1)
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            
            //alliance create logic
            if(args[0] == 'create'){
                if(args.length <= 1) return client.sendError(message, 'Invalid usage.')
                let allianceName = args.splice(1).join(' ')
                client.sendCheck(message, `Are you sure you want to create an alliance with the name **${allianceName}**?`)
                const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
                collector.on('collect', message => {
                    if (message.content.toLowerCase() == 'yes') {
                        client.game.createAlliance(message.author.id, allianceName)
                        .then(() => message.reply('Successfully created alliance.'))
                        .catch(e => client.sendError(message, e))
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

            //alliance leave logic
            if(args[0] == 'leave'){
                client.sendCheck(message, `Are you sure you want to leave your alliance?`)
                const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
                collector.on('collect', message => {
                    if (message.content.toLowerCase() == 'yes') {
                        client.game.leaveAlliance(message.author.id)
                        .then(() => message.reply('Successfully left alliance.'))
                        .catch(e => client.sendError(message, e))
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

            //alliance disband logic
            if(args[0] == 'disband'){
                client.sendCheck(message, `Are you sure you want to disband your alliance?`)
                const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
                collector.on('collect', message => {
                    if (message.content.toLowerCase() == 'yes') {
                        client.game.disbandAlliance(message.author.id)
                        .then(() => message.reply('Successfully disband alliance.'))
                        .catch(e => client.sendError(message, e))
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

            //alliance statistics
            if(args[0] == 'stats'){
                client.game.getUserAlliance(message.author.id)
                .then(async alliance => {
                    let embed = new client.discord.MessageEmbed()
                    embed.setTitle('Alliance')
                    embed.setDescription(`${alliance.description}`)
                    await client.users.fetch(alliance.owner, true)
                    .then(u => embed.addField('Leader', `\`${u.username}#${u.discriminator}\``, true))
                    embed.addField('Members', `\`${alliance.members.length}\``, true)
                    embed.addField('Alliance Wallet', `\`${alliance.credits.toLocaleString()}\``, true)
                    embed.addField('Alliance Tax Rate', `\`${alliance.tax * 100}\`%`, true)
                    embed.addField('Home', `\`${alliance.homeSystemX}\` | \`${alliance.homeSystemY}\``, true)
                    embed.setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                    embed.setTimestamp()
                    embed.setColor(client.settings.embedColor)
                    await message.channel.send(embed)
                })
                .catch(e => client.sendError(message, e))
            }

            //alliance invest logic
            if(args[0] == 'invest'){
                if(args.length <= 1) return client.sendError(message, 'Invalid usage.')
                let amount = Math.floor(parseInt(args[1]))
                client.sendCheck(message, `Are you sure you want to invest ${amount} into the alliance?`)
                const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
                collector.on('collect', message => {
                    if (message.content.toLowerCase() == 'yes') {
                        client.game.investToAlliance(message.author.id, amount)
                        .then(() => message.reply('Successfully invested in alliance.'))
                        .catch(e => client.sendError(message, e))
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

            //alliance kick logic
            if(args[0] == 'kick'){
                if(args.length <= 1) return client.sendError(message, 'Invalid usage.')
                let user = args[1].replace(/[<!@>]/g, '')
                client.sendCheck(message, `Are you sure you want to kick <@${user}> from the alliance?`)
                const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
                collector.on('collect', message => {
                    if (message.content.toLowerCase() == 'yes') {
                        client.game.kickFromAlliance(message.author.id, user)
                        .then(() => message.reply('Successfully kicked them from alliance.'))
                        .catch(e => client.sendError(message, e))
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

            //alliance members logic
            if(args[0] == 'members'){
                if(!args[1]) args[1] = 1
                await client.game.getAllianceMembersList(message.author.id, parseInt(args[1]))
                .then(members => {
                    let embed = new client.discord.MessageEmbed()
                    embed.setTitle('Alliance')
                    embed.setDescription(`Alliance members, page \`${args[1]}\`.\n\`\`\`${members.join('\n')}\`\`\``)
                    embed.setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                    embed.setTimestamp()
                    embed.setColor(client.settings.embedColor)
                    message.channel.send(embed)
                })
                .catch(e => client.sendError(message, e))
            }

            //join alliance
            if(args[0] == 'join'){
                let allianceName = args.splice(1).join(' ')
                client.game.applyToAlliance(message.author.id, allianceName)
                .then(users => {
                    message.channel.send(`Applied to alliance.`)
                })
                .catch(e => client.sendError(message, e))
            }

            //ally applications
            if(args[0] == 'apps'){
                
                //list
                if(args[1] == 'list'){
                    if(!args[2]) args[2] = 1
                    client.game.getAllianceApplications(message.author.id, parseInt(args[2]))
                    .then(users => {
                        message.channel.send(`Applications page \`${args[2]}\` \`\`\`${users.join('\n')}\`\`\``)
                    })
                    .catch(e => client.sendError(message, e))
                }

                //accpet
                if(args[1] == 'accept'){
                    client.game.acceptAllianceApplications(message.author.id, parseInt(args[2]))
                    .then(() => {
                        message.reply('Accepted user into alliance.')
                    })
                    .catch(e => client.sendError(message, e))
                }

                //deny
                if(args[1] == 'deny'){
                    client.game.denyAllianceApplications(message.author.id, parseInt(args[2]))
                    .then(() => {
                        message.reply('Denied user from alliance.')
                    })
                    .catch(e => client.sendError(message, e))
                }
            }

            //settings stuff
            if(args[0] == 'set'){

                //description
                if(args[1] == 'description'){
                    if(args.length <= 2) return client.sendError(message, 'Invalid usage.')
                    let description = args.splice(1).splice(1).join(' ')
                    client.sendCheck(message, `Are you sure you want to set the alliance description to \`${description.replace(/\n/g, ' ')}\`?`)
                    const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
                    collector.on('collect', message => {
                        if (message.content.toLowerCase() == 'yes') {
                            client.game.setAllianceDescription(message.author.id, description)
                            .then(() => message.reply('Successfully set description.'))
                            .catch(e => client.sendError(message, e))
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

                //tax rate
                if(args[1] == 'tax'){
                    if(args.length <= 2) return client.sendError(message, 'Invalid usage.')
                    let rate = Math.floor(parseInt(args[2].replace(/%/g, '')))
                    client.sendCheck(message, `Are you sure you want to set the alliance tax to \`${rate}\`%?`)
                    const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
                    collector.on('collect', message => {
                        if (message.content.toLowerCase() == 'yes') {
                            client.game.setAllianceTax(message.author.id, rate)
                            .then(() => message.reply('Successfully set tax.'))
                            .catch(e => client.sendError(message, e))
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

                //alliance home
                if(args[1] == 'home') {
                    if(args.length != 4) return client.sendError(message, 'Invalid usage.')
                    let xPos = Math.floor(parseInt(args[2]))
                    let yPos = Math.floor(parseInt(args[3]))
                    client.sendCheck(message, `Are you sure you want to set the alliance home system to \`${xPos}\`|\`${yPos}\`?`)
                    const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
                    collector.on('collect', message => {
                        if (message.content.toLowerCase() == 'yes') {
                            client.game.setAllianceHome(message.author.id, xPos, yPos)
                            .then(() => message.reply('Successfully set home.'))
                            .catch(e => client.sendError(message, e))
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
}