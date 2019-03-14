module.exports.load = client => {
    client.commands['redeem'] = {
        conf : {
            'name' : 'Redeem',
            'type' : 2,
            'description' : `One time use command for server owners to get \`${client.settings.game.member_reward}\` credits per member in their server.`,
            'usage' : `${client.settings.prefix}redeem`
        },

        run(message) {
            client.load_user_data(message.author.id, user_res => {
                if(message.member.guild.ownerID != message.author.id) return client.send_error(message, 'You do not own this guild.')
                client.load_g_owner_array(g => {
                    if(g.owners.includes(message.author.id)) return client.send_error(message, 'You have already redeemed this reward.')
                    let reward = message.member.guild.memberCount * client.settings.game.member_reward
                    user_res.credits += reward
                    g.owners.push(message.author.id)
                    
                    let embed = new client.discord.RichEmbed()
                    .setTitle('Redeem')
                    .setDescription(`**${message.author.username}**, you have been rewarded \`${reward}\` credits for adding the bot, thanks!`)
                    .setTimestamp()
                    .setColor(client.settings.embed_color)
                    message.channel.send(embed)

                    client.write_user_data(message.author.id, user_res)
                    client.write_g_owner_array(g)
                })
            })
        }
    }
}