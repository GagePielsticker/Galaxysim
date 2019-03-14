module.exports.load = client => {
    client.commands['return'] = {
        conf : {
            'name' : 'Return',
            'type' : 2,
            'description' : 'Return to your nearest colony to refuel.',
            'usage' : `${client.settings.prefix}return`
        },

        run(message) {
            client.load_user_data(message.author.id, async user_res => {
                if(client.cooldowns.collector.includes(message.author.id)) return client.send_error(message, 'Please answer the current prompt.')
                if(client.cooldowns.action.includes(message.author.id)) return client.send_error(message, 'You are currently performing an action.')

                let pos = {
                    x : null,
                    y : null
                }
                let dist = 9999999999999
                await user_res.colonies.forEach(col => {
                    if(distance(user_res.x_pos, user_res.y_pos, col.x_pos, col.y_pos) < dist) {
                        dist = distance(user_res.x_pos, user_res.y_pos, col.x_pos, col.y_pos)
                        pos.x = col.x_pos
                        pos.y = col.y_pos
                    }
                })

                if(pos.x == null || pos.y == null) {
                    pos.x = user_res.x_pos + 20
                    pos.y = user_res.y_pos + 15
                    dist = distance(user_res.x_pos, user_res.y_pos, pos.x, pos.y)
                    let travel_time = Math.ceil(dist * client.settings.game.warp_time_multiplier / user_res.ship.warp_speed)

                    client.send_error(message, `You currently do not own any colonies, warping you to trade system. This will take \`${client.humanize(travel_time * 1000)}\`.`)

                    client.cooldowns.action.push(message.author.id)
                    setTimeout(() => {
                        user_res.x_pos = pos.x
                        user_res.y_pos = pos.y
                        user_res.ship.fuel = user_res.ship.max_fuel
                        client.write_user_data(message.author.id, user_res)
                        client.cooldowns.action.splice(client.cooldowns.action.indexOf(message.author.id), 1)
                        message.reply(`You have successfully warped!`)
                    }, travel_time * 1000)
                    
                } else {
                    let travel_time = Math.ceil(dist * client.settings.game.warp_time_multiplier / user_res.ship.warp_speed)
                    client.send_error(message, `Emergency warping you to your closest colony to refuel. This will take \`${client.humanize(travel_time * 1000)}\``)
                    client.cooldowns.action.push(message.author.id)
                    setTimeout(() => {
                            user_res.x_pos = pos.x
                            user_res.y_pos = pos.y
                            user_res.ship.fuel = user_res.ship.max_fuel
                            client.write_user_data(message.author.id, user_res)
                            client.cooldowns.action.splice(client.cooldowns.action.indexOf(message.author.id), 1)
                            message.reply(`You have successfully warped!`)
                        }, travel_time * 1000)
                }

                function distance(x1, y1, x2, y2) {
                    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
                }
            })
        }
    }
}