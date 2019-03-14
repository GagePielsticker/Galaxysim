module.exports.load = client => {
    client.commands['user'] = {
        conf : {
            'name' : 'User',
            'type' : 2,
            'description' : 'View game user information.',
            'usage' : `${client.settings.prefix}user`
        },

        run(message) {
            client.load_user_data(message.author.id, async res => {
                let embed = await new client.discord.RichEmbed()
                embed.setTitle('User')
                embed.setDescription('This page contains general user information for your player.')
                embed.addField('Position X|Y', `\`${res.x_pos} | ${res.y_pos}\``, true)
                embed.addField('Credits', `\`${res.credits.toLocaleString()}\``, true)
                if(res.alliance == null) {
                    embed.addField('Alliance', `\`none\``, true)
                } else {
                    embed.addField('Alliance', `\`${res.alliance}\``, true)
                }
                embed.addField('Colonies', `\`${res.colonies.length}\``, true)
                embed.addField('Ship Type', `\`${res.ship.type}\``, true)
                embed.addField('Ship Att|Def', `\`${res.ship.att}|${res.ship.def}\``, true)
                embed.addField('Ship Mining Strength', `\`${res.ship.mining_speed}/${res.ship.max_mining_speed}\``, true)
                embed.addField('Ship Warp Speed', `\`${res.ship.warp_speed}/${res.ship.max_warp_speed}\``, true)
                embed.addField('Ship Fuel', `\`${res.ship.fuel}/${res.ship.max_fuel}\``, true)
                embed.setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
                embed.setTimestamp()
                embed.setColor(client.settings.embed_color)
                
                if(res.beta_status){
                    embed.setThumbnail(`https://i.imgur.com/rxkNCaG.png`)
                }

                await message.channel.send(embed)
                .catch(e => client.log(`Error sending message to ${message.author.username}#${message.author.discriminator}.`))
            })
        }
    }
}