module.exports.load = client => {
    client.commands['cols'] = {
        conf : {
            'name' : 'Colonies',
            'type' : 2,
            'description' : 'List all colonies you own and their stats.',
            'usage' : `${client.settings.prefix}cols {page #}`
        },

        run(message) {
            client.load_user_data(message.author.id, user_res => {
                let args = message.content.split(' ').splice(1)
                if(args.length == 0) args[0] = 1
                if(!Number.isInteger(parseInt(args[0]))) return client.send_error(message, 'Invalid page number.') 
                let output_array = []
                for(let j = client.settings.game.colonies_list_amount * parseInt(args[0]) - client.settings.game.colonies_list_amount; j <= client.settings.game.colonies_list_amount * parseInt(args[0]) - 1; j++){ 
                    if(user_res.colonies[j] != undefined){
                        output_array.push(`${user_res.colonies[j].name} | ${user_res.colonies[j].x_pos},${user_res.colonies[j].y_pos}\nr:${user_res.colonies[j].resources}|c:${user_res.colonies[j].investments}|p:${user_res.colonies[j].population}`)
                    }
                }
                let page_max = Math.ceil(user_res.colonies.length / client.settings.game.colonies_list_amount)
                if(parseInt(args[0]) > page_max) output_array.push('None')

                message.channel.send(`Here is a list of all your colonies. \`(${args[0]}/${page_max})\`\n\`\`\`${output_array.join('\n---------\n')}\`\`\`\`r\` = resources; \`c\` = investments; \`p\` = population;`)
                .catch(e => client.log(`Error sending message to ${message.author.username}#${message.author.discriminator}.`)) 
            })
        }
    }
}