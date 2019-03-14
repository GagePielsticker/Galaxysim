module.exports.load = client => {
    client.commands['mine'] = {
        conf : {
            'name' : 'Mine',
            'type' : 2,
            'description' : 'Mine astroids in the star system (regenerated every day, 10s cooldown).',
            'usage' : `${client.settings.prefix}mine`
        },

        run(message) {
            client.load_user_data(message.author.id, user_res => {
                client.load_system_data(user_res.x_pos, user_res.y_pos, async sys_res => {

                    if(client.cooldowns.collector.includes(message.author.id)) return client.send_error(message, 'Please answer the current prompt.')
                    if(client.cooldowns.action.includes(message.author.id)) return client.send_error(message, 'You are currently performing an action.')
                    if(client.cooldowns.mining.includes(message.author.id)) return client.send_error(message, `You on the mining cooldown of \`${client.settings.game.mining_cooldown}\` seconds.`)
                    if(sys_res.astroids == 0) return client.send_error(message, 'There are no asteroids belts in this system.')

                    let astroids_mined = user_res.ship.mining_speed * client.settings.game.base_mining_multiplier

                 
                    if(sys_res.astroids - astroids_mined < 0) {sys_res.astroids = 0}
                    else {sys_res.astroids -= astroids_mined}

                    let vote_multiplier = 1
                    await client.dbl.hasVoted(user_res.id)
                    .then(r => {
                        if(r) vote_multiplier = client.settings.game.vote_mining_multiplier
                    })

                    let profits = Math.floor(astroids_mined * client.settings.game.astroid_cost * vote_multiplier)
                    user_res.credits += profits

                    await client.write_user_data(message.author.id, user_res)
                    await client.write_system_data(user_res.x_pos, user_res.y_pos, sys_res)

                    message.reply(`You mined the system of \`${astroids_mined}\` asteroids generating \`${profits.toLocaleString()}\` credits!` )
                    client.cooldowns.mining.push(message.author.id)

                    setTimeout(() => {
                        client.cooldowns.mining.splice(client.cooldowns.mining.indexOf(message.author.id), 1)
                    }, client.settings.game.mining_cooldown * 1000)

                })
            })
        }
    }
}