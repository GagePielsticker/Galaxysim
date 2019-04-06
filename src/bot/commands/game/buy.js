module.exports.load = client => {
    client.commands['buy'] = {
        conf : {
            'name' : 'Buy',
            'type' : 2,
            'description' : 'A place to purchase new ships.',
            'usage' : `${client.settings.prefix}buy list {#}\n${client.settings.prefix}buy show {ship}\n${client.settings.prefix}buy {ship}`
        },

        run(message) {
            let args = message.content.split(' ').splice(1)
            
            if(args[0] == 'list'){
                
                if(!args[1]) args[1] = 1
                else args[1] = parseInt(args[1])
                if(!Number.isInteger(parseInt(args[1]))) return client.send_error(message, 'Invalid page number.') 
                let output_array = []
                for(let j = client.settings.game.shop_list_amount * parseInt(args[1]) - client.settings.game.shop_list_amount; j <= client.settings.game.shop_list_amount * parseInt(args[1]) - 1; j++){ 
                    if(client.ships[j]){
                        output_array.push(`${client.ships[j].type}`)
                    }
                }
                let checker = setInterval(() => {
                    if(output_array.length >= 1) {
                        cont()
                        clearInterval(checker)
                    }
                }, 300)
                function cont(){
                    let page_max = Math.ceil(client.ships.length / client.settings.game.shop_list_amount)
                    if(parseInt(args[1]) > page_max) output_array.push('None')
                    message.channel.send(`Here is a list of all available ships to purchase. To learn more use \`${client.settings.prefix}buy show {ship}\`. Page \`(${args[1]}/${page_max})\`\n\`\`\`\n${output_array.join('\n')}\`\`\``)
                }
            } else if(args[0] == 'show') {
                let obj
                client.ships.forEach(ship => {
                    if(ship.type == args[1]) obj = ship
                })
                let embed = new client.discord.RichEmbed()
                .setTitle('Ship')
                .setDescription(`The \`${obj.type}\` is worth \`${obj.cost.toLocaleString()}\` credits.`)
                .addField('Description', `\`${obj.description}\``)
                .addField('Att|Def', `\`${obj.att}\`|\`${obj.def}\``, true)
                .addField('Warp', `\`${obj.warp_speed}\`/\`${obj.max_warp_speed}\``, true)
                .addField('Mining', `\`${obj.mining_speed}\`/\`${obj.max_mining_speed}\``, true)
                .addField('Cargo', `\`${obj.cargo.length}\`/\`${obj.max_cargo}\``, true)
                .setTimestamp()
                .setColor(client.settings.embed_color)
                message.channel.send(embed)
            } else {
                let bought_ship = false
                client.ships.forEach(ent => {
                    if(ent.type == args[0]) bought_ship = ent
                })
                let embed = new client.discord.RichEmbed()
                .setTitle('Ship')
                .setDescription(`**${message.author.username}**, you are about to buy a ship for \`${bought_ship.cost}\`, are you sure?\nRespond with \`yes\` or \`no\`.`)
                .setTimestamp()
                .setColor(client.settings.embed_color)
                message.channel.send(embed)
                setTimeout(() => {
                    client.cooldowns.collector.splice(client.cooldowns.collector.indexOf(message.author.id), 1)
                }, client.settings.collector_timeout * 1000)
                const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collector_timeout * 1000 })
                collector.on('collect', message => {
                    if (message.content.toLowerCase() == `yes`) {
                        client.buy_ship(message.author.id, args[0])
                        .then(() => {
                            let embed = new client.discord.RichEmbed()
                            .setTitle('Ship')
                            .setDescription(`Successfully bought ship.`)
                            .setTimestamp()
                            .setColor(client.settings.embed_color)
                            message.channel.send(embed)
                        })
                        .catch(e => client.send_error(message, e))
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
    }
}