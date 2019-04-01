module.exports.load = client => {
    client.commands['ally'] = {
        conf : {
            'name' : 'Alliance',
            'type' : 2,
            'description' : 'Join, Create, modify, and leave alliances.',
            'usage' : `--all users--\n${client.settings.prefix}ally members\n${client.settings.prefix}ally leaderboard\n${client.settings.prefix}ally join {name}\n${client.settings.prefix}ally stats\n${client.settings.prefix}ally leave\n${client.settings.prefix}ally create {name}\n${client.settings.prefix}ally invest {amount}\n\n--alliance owners--\n${client.settings.prefix}ally description {string}\n${client.settings.prefix}ally disband\n${client.settings.prefix}ally kick {user}\n${client.settings.prefix}ally apps list {#}\n${client.settings.prefix}ally apps accept {name}\n${client.settings.prefix}ally apps deny {name}`
        },

        run(message) {
            client.load_user_data(message.author.id, user_res => {

                let args = message.content.split(' ').splice(1)
                if(client.cooldowns.collector.includes(message.author.id)) return client.send_error(message, 'Please answer the current prompt.')

                if(args[0] == 'join'){
                    if(!args[1]) return client.send_error(message, 'Please enter a name.')
                    let a_name = args.splice(1).join(' ')

                    client.load_alliance_data(a_name, ally_res => {
                        if(ally_res == null) return client.send_error(message, 'An alliance with that name doesn\'t exist!.')
                        else {
                            if(ally_res.join_req.includes(message.author.id)) return client.send_error(message, 'You are already applied for this alliance.')
                            let embed = new client.discord.RichEmbed()
                            .setTitle('Alliance')
                            .setDescription(`**${message.author.username}**, you are about to apply for an alliance, are you sure?\nRespond with \`yes\` or \`no\`.`)
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
                                    ally_res.join_req.push(message.author.id)
                                    client.write_alliance_data(a_name, ally_res)
                                    message.reply('You have applied for the alliance.')
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
                } //done

                if(args[0] == 'leave'){
                    client.load_alliance_data(user_res.alliance, ally_res => {
                        if(ally_res == null) return client.send_error(message, 'You are not in an alliance.')
                        if(ally_res.owner_id == message.author.id) return client.send_error(message, 'You are the owner of this alliance, to leave you must disband it.')
                        let embed = new client.discord.RichEmbed()
                        .setTitle('Alliance')
                        .setDescription(`**${message.author.username}**, you are about to leave an alliance, are you sure?\nRespond with \`yes\` or \`no\`.`)
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
                                user_res.alliance = null
                                ally_res.members
                                ally_res.members.splice(ally_res.join_req.indexOf(message.author.id), 1)
                                client.write_user_data(message.author.id, user_res)
                                client.write_alliance_data(ally_res.name, ally_res)
                                message.reply('You have successfully left the alliance.')
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
                } //done

                if(args[0] == 'invest'){
                    if(!args[1]) return client.send_error(message, 'Invalid usage.')
                    if(!Number.isInteger(parseInt(args[1])) || parseInt(args[1]) < 0) return client.send_error(message, 'Invalid investment amount.')
                    if(user_res.credits - parseInt(args[1]) < 0) return client.send_error(message, 'You cant afford this.')

                    client.load_alliance_data(user_res.alliance, ally_res => {
                        if(ally_res == null) return client.send_error(message, 'You are not in an alliance.')
                        
                        let embed = new client.discord.RichEmbed()
                        .setTitle('Invest')
                        .setDescription(`**${message.author.username}**, are you sure you want to invest \`${args[1]}\` into the alliance?\nRespond with \`yes\` or \`no\`.`)
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
                                message.reply('Successfully invested money into alliance.')
                                user_res.credits -= parseInt(args[1])
                                ally_res.credits += parseInt(args[1])
                                client.write_user_data(message.author.id, user_res)
                                client.write_alliance_data(ally_res.name, ally_res)
                                client.cooldowns.collector.splice(client.cooldowns.collector.indexOf(message.author.id), 1)
                                collector.stop()
                            }
                            if (message.content.toLowerCase() == 'no') {
                                client.send_error(message, 'Action cancelled.')
                                client.cooldowns.collector.splice(client.cooldowns.collector.indexOf(message.author.id), 1)
                                collector.stop()
                            }
                        })

                    })
                } //done

                if(args[0] == 'create'){
                    if(!args[1]) return client.send_error(message, 'Please enter a name.')
                    if(user_res.credits - client.settings.game.alliance_create_cost < 0) return client.send_error(message, `You can\'t afford an alliance. They currently cost \`${client.settings.game.alliance_create_cost}\` credits.`)
                    if(user_res.alliance != null) return client.send_error(message, 'You are currently in an alliance.')
                    let a_name = args.splice(1).join(' ')
                    client.load_alliance_data(a_name, ally_res => {
                        if(ally_res != null) return client.send_error(message, 'An alliance with that name exist.')
                        else cont()
                    })

                    function cont() {
                        let embed = new client.discord.RichEmbed()
                        .setTitle('Alliance')
                        .setDescription(`**${message.author.username}**, you are about to create an alliance which will cost you \`${client.settings.game.alliance_create_cost}\` credits.\nRespond with \`yes\` or \`no\`.`)
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
                                user_res.alliance = a_name
                                client.write_user_data(message.author.id, user_res)
                                client.create_alliance(message.author.id, a_name)
                                message.reply('Your alliance has been created!')
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
                }

                if(args[0] == 'kick'){
                    client.load_alliance_data(user_res.alliance, ally_res => {
                        if(ally_res == null) return client.send_error(message, 'You are not in an alliance.')
                        if(ally_res.owner_id != message.author.id) return client.send_error(message, 'You are not the owner of this alliance.')
                        if(!ally_res.members.includes(args[1].replace(/[<!@>]/g, ''))) return client.send_error(message, 'User is not in alliance')

                        client.load_user_data(args[1].replace(/[<!@>]/g, ''), temp_user => {
                            temp_user.alliance = null
                            client.write_user_data(temp_user.id, temp_user)
                        })
                        ally_res.members.splice(ally_res.members.indexOf(args[1].replace(/[<!@>]/g, '')), 1)
                        client.write_alliance_data(ally_res.name, ally_res)
                        message.reply('User has been removed from alliance.')
                    })
                } //done

                if(args[0] == 'disband'){
                    client.load_alliance_data(user_res.alliance, ally_res => {
                        if(ally_res == null) return client.send_error(message, 'You are not in an alliance.')
                        if(ally_res.owner_id != message.author.id) return client.send_error(message, 'You are not the owner of this alliance.')

                        let embed = new client.discord.RichEmbed()
                        .setTitle('Alliance')
                        .setDescription(`**${message.author.username}**, you are about to disband your alliance, are you sure?\nRespond with \`yes\` or \`no\`.`)
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
                                ally_res.members.forEach(mem => {
                                    client.load_user_data(mem, data => {
                                        data.alliance = null
                                        client.write_user_data(data.id, data)
                                    })
                                })
                                user_res.alliance = null
                                client.write_user_data(user_res.id, user_res)
                                client.delete_alliance_data(ally_res.name)
                                message.reply('Your alliance has been disbanded.')
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
                } //done

                if(args[0] == 'description'){
                    client.load_alliance_data(user_res.alliance, ally_res => {
                        if(ally_res == null) return client.send_error(message, 'You are not in an alliance.')
                        if(ally_res.owner_id != message.author.id) return client.send_error(message, 'You are not the owner of this alliance.')

                        let c_description = message.content.split(' ').splice(2).join(' ')
                        if(c_description == '') return client.send_error(message, 'You cant have an empty description.')

                        client.cooldowns.collector.push(message.author.id)

                        let embed = new client.discord.RichEmbed()
                        .setTitle('Alliance')
                        .setDescription(`**${message.author.username}**, you are about to set your description to \`${c_description}\`. \nRespond with \`yes\` or \`no\`.`)
                        .setTimestamp()
                        .setColor(client.settings.embed_color)
                        message.reply(embed)

                        setTimeout(() => {
                            client.cooldowns.collector.splice(client.cooldowns.collector.indexOf(message.author.id), 1)
                        }, client.settings.collector_timeout * 1000)

                        const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collector_timeout * 1000 })
                        collector.on('collect', message => {
                            if (message.content.toLowerCase() == `yes`) {
                                ally_res.description = c_description 
                                client.write_alliance_data(ally_res.name, ally_res)
                                message.reply('You have successfully changed your alliance description')
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

                if(args[0] == 'members'){
                    client.load_alliance_data(user_res.alliance, ally_res => {
                        if(ally_res == null) return client.send_error(message, 'You are not in an alliance.')
                        if(ally_res.members.length == 0) return client.send_error(message, 'There are no members in this alliance.')
                        if(!args[1]) args[1] = 1
                        else args[1] = parseInt(args[1])
                        if(!Number.isInteger(parseInt(args[1]))) return client.send_error(message, 'Invalid page number.') 
                        let output_array = []

                        for(let j = client.settings.game.alliance_list_amount * parseInt(args[1]) - client.settings.game.alliance_list_amount; j <= client.settings.game.alliance_list_amount * parseInt(args[1]) - 1; j++){ 
                            if(ally_res.members[j] != undefined){
                                client.fetchUser(ally_res.members[j], true)
                                .then(u => {
                                    output_array.push(`${u.username}#${u.discriminator}`)
                                })
                            }
                        }
                        let checker = setInterval(() => {
                            if(output_array.length >= 1) {
                                cont()
                                clearInterval(checker)
                            }
                        }, 300)

                        function cont(){
                            let page_max = Math.ceil(ally_res.members.length / client.settings.game.alliance_list_amount)
                            if(parseInt(args[1]) > page_max) output_array.push('None')
                            message.channel.send(`Here is a list of all \`${ally_res.members.length}\` members in your guild. \`(${args[1]}/${page_max})\`\n\`\`\`${output_array.join('\n')}\`\`\``)
                        }


                    })
                }

                if(args[0] == 'stats'){
                    client.load_alliance_data(user_res.alliance, async ally_res => {
                        if(ally_res == null) return client.send_error(message, 'You are not in an alliance.')
                        let embed = new client.discord.RichEmbed()
                        embed.setTitle('Alliance')
                        embed.setDescription(`${ally_res.description}`)
            
                        await client.fetchUser(ally_res.owner_id, true)
                        .then(u => {
                            embed.addField('Leader', `\`${u.username}#${u.discriminator}\``, true)
                        })
                        embed.addField('Members', `\`${ally_res.members.length}\``, true)
                        embed.addField('Alliance Wallet', `\`${ally_res.credits.toLocaleString()}\``, true)
                        embed.addField('Alliance Tax Rate', `\`${ally_res.tax}\``, true)
                        embed.addField('Trade Routes', `\`${ally_res.trade_routes.length}\``, true)
                        embed.addField('Home', `\`${ally_res.home_system_x}\` | \`${ally_res.home_system_y}\``, true)
                        embed.setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                        embed.setTimestamp()
                        embed.setColor(client.settings.embed_color)
                        await message.channel.send(embed)
                    })
                }

                if(args[0] == 'apps'){
                    client.load_alliance_data(user_res.alliance, ally_res => {
                        if(ally_res == null) return client.send_error(message, 'You are not in an alliance.')
                        if(ally_res.owner_id != message.author.id) return client.send_error(message, 'You do not own your current alliance.')

                        if(args[1] == 'list'){
                            if(!args[2]) args[2] = 1
                            if(!Number.isInteger(parseInt(args[2]))) return client.send_error(message, 'Invalid page number.') 

                            let output_array = []
                            for(let j = client.settings.game.alliance_list_amount * parseInt(args[2]) - client.settings.game.alliance_list_amount; j <= client.settings.game.alliance_list_amount * parseInt(args[2]) - 1; j++){ 
                                if(ally_res.join_req[j] != undefined){
                                    client.fetchUser(ally_res.join_req[j], true)
                                    .then(u => {
                                        output_array.push(`${j} : ${u.username}#${u.discriminator}`)
                                    })
                                }
                            }

                            let checker = setInterval(() => {
                                if(output_array.length >= 1) {
                                    cont()
                                    clearInterval(checker)
                                }
                            }, 300)

                            function cont(){
                                let page_max = Math.ceil(ally_res.join_req.length / client.settings.game.alliance_list_amount)
                                if(parseInt(args[2]) > page_max) output_array.push('None')
                                message.channel.send(`Here is a list of all your applicants. \`(${args[2]}/${page_max})\`\n\`\`\`${output_array.join('\n')}\`\`\`To accept/deny use \`${client.settings.prefix}ally apps accept/deny {#}\``)
                                .catch(e => client.log(`Error sending message to ${message.author.username}#${message.author.discriminator}.`)) 
                            }
                        }
                        if(args[1] == 'accept'){

                            if(!Number.isInteger(parseInt(args[2]))) return client.send_error(message, 'Invalid id.')
                            if(parseInt(args[2]) > ally_res.join_req.length - 1 || parseInt(args[2]) < 0) return client.send_error(message, 'Invalid id.')
                            
                            
                            client.fetchUser(ally_res.join_req[parseInt(args[2])], true)
                            .then(u => {
                                u.send(`You have been accepted to the \`${ally_res.name}\` alliance.`)
                            })
                            message.reply('User has been accepted.')

                            client.load_user_data(ally_res.join_req[parseInt(args[2])], user_res_temp => {
                                if(user_res_temp.alliance != null){
                                    client.load_alliance_data(user_res.alliance, temp_ally => {
                                        temp_ally.members.splice(temp_ally.members.indexOf(user_res_temp.id), 1)
                                        client.write_alliance_data(temp_ally.name, temp_ally)
                                    })
                                }

                                user_res_temp.alliance = ally_res.name
                                client.write_user_data(user_res_temp.id, user_res_temp)
                            })

                            ally_res.members.push(ally_res.join_req[parseInt(args[2])])
                            ally_res.join_req.splice(parseInt(args[2]), 1)
                            client.write_alliance_data(ally_res.name, ally_res)

                        }
                        if(args[1] == 'deny'){

                            if(!Number.isInteger(parseInt(args[2]))) return client.send_error(message, 'Invalid id.')
                            if(parseInt(args[2]) > ally_res.join_req.length || parseInt(args[2]) < 0) return client.send_error(message, 'Invalid id.')
                            client.fetchUser(ally_res.join_req[parseInt(args[2])], true)
                            .then(u => {
                                u.send(`You have been denied from the \`${ally_res.name}\` alliance.`)
                            })
                            message.reply('User has been denied.')

                            ally_res.join_req.splice(parseInt(args[2]), 1)
                            client.write_alliance_data(ally_res.name, ally_res)

                        }
                    })
                }

                if(args[0] == 'leaderboard'){
                    client.load_alliance_data('*', data => {
                        data.toArray()
                        .then(async r => {
                            let leaderboard = []
                            await r.forEach(doc => {
                                leaderboard.push(`${doc.name}|${doc.credits}`)
                            })
                            await leaderboard.sort((a, b) => {
                                a = a.split('|').splice(1).join('')
                                b = b.split('|').splice(1).join('')
                                return b - a
                            })
                            leaderboard.length = client.settings.game.leaderboard_length
                            let output = []
                            let i = 1
                            await leaderboard.forEach(e => {
                                output.push(`${i}.) \`${e.split('|')[0]} - ${parseInt(e.split('|')[1]).toLocaleString()}\``)
                                i++
                            })
                            let embed = new client.discord.RichEmbed()
                            .setTitle('Leaderboard')
                            .setDescription(`**${message.author.username}**, Here are the top alliances based on wallet.\n${output.join('\n')}`)
                            .setTimestamp()
                            .setColor(client.settings.embed_color)
                            message.channel.send(embed)
                        })
                    })
                    
                }
            })
        }
    }
}