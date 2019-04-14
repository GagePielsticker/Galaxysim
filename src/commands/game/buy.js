module.exports.load = client => {
    client.commands['buy'] = {
        settings : {
            type : 'game',
            description : 'All commands related to ship purchasing.',
            usage : `${client.settings.prefix}buy list {#}\n${client.settings.prefix}buy show {ship}\n${client.settings.prefix}buy {ship}`
        },

        async run(message) {
            let args = message.content.split(' ').splice(1)
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            switch(args[0]){

                //listing all ships
                case 'list':
                    if(args.length != 2) args[1] = 1
                    client.game.getShipList(parseInt(args[1]))
                    .then(array => {
                        let embed = new client.discord.MessageEmbed()
                        embed.setTitle('Ships')
                        embed.setDescription(`All ships available, page \`${args[1]}\`.\n\`\`\`${array.join('\n')}\`\`\`To see more use ${client.settings.prefix}buy show {ship}`)
                        embed.setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                        embed.setTimestamp()
                        embed.setColor(client.settings.embedColor)
                        message.channel.send(embed)
                    })
                    .catch(e => client.sendError(message, e))
                    break

                //showing specific ship stats
                case 'show':
                    if(args.length != 2) return client.sendError(message, 'Invalid usage.')
                    client.game.getShip(args[1])
                    .then(ship => {
                        let embed = new client.discord.MessageEmbed()
                        .setTitle('Ship')
                        .setDescription(`The \`${ship.type}\` is worth \`${ship.cost.toLocaleString()}\` credits.`)
                        .addField('Description', `\`${ship.description}\``)
                        .addField('Attack', `\`${ship.attack}\`/\`${ship.maxAttack}\``, true)
                        .addField('Attack', `\`${ship.defense}\`/\`${ship.maxDefense}\``, true)
                        .addField('Warp', `\`${ship.warpSpeed}\`/\`${ship.maxWarpSpeed}\``, true)
                        .addField('Mining', `\`${ship.miningSpeed}\`/\`${ship.maxMiningSpeed}\``, true)
                        .addField('Fuel', `\`${ship.fuel}\`/\`${ship.maxFuel}\``, true)
                        .addField('Ore Storage', `\`${ship.oreStorage}\`/${ship.oreStorageMax}`, true)
                        .addField('Cargo', `\`${ship.cargo.length}\`/\`${ship.maxCargo}\``, true)
                        .setTimestamp()
                        .setColor(client.settings.embedColor)
                        message.channel.send(embed)
                    })
                    .catch(e => client.sendError(message, e))
                    break

                //purchasing ship
                default:
                    let boughtShip
                    client.ships.forEach(e => {
                        if(e.type == args[0]) boughtShip = e
                    })
                    if(!boughtShip) return client.sendError(message, 'Ship does not exist.')
                    client.sendCheck(message, `You are about to buy a \`${boughtShip.type}\` which will cost \`${boughtShip.cost}\` credits.`)
                    const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
                    collector.on('collect', message => {
                        if (message.content.toLowerCase() == 'yes') {
                            client.game.buyShip(message.author.id, boughtShip.type)
                            .then(() => message.reply('Successfully purchased ship.'))
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
                    break
            }
        }
    }
}