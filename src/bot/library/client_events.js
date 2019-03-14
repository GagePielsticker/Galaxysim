module.exports = client => {

    //on ever discord message 
    client.on('message', async message => {
        if(message.author.bot) return
        client.message_logger(message)
        if(!client.message_has_prefix(message)) return
        if(!client.command_exist(message.content.split(' ')[0].replace(client.settings.prefix, ''))) return
        if(client.commands[message.content.split(' ')[0].replace(client.settings.prefix, '')].conf.type == 2){
            client.load_user_data(message.author.id, async res => {
                if(res == null) await client.create_user(message.author.id)
                await continue_execution()
            })
        } else {
            continue_execution()
        }
        function continue_execution(){
            client.commands[message.content.split(' ')[0].replace(client.settings.prefix, '')].run(message)
            client.log(`${message.author.username}#${message.author.discriminator} executed || ${message.content.split(' ')[0]} || ${message.content.split(' ').splice(1).join(', ')}`)
        }
    })

    //executes once bot is connected to discord
    client.on('ready', () => {
        client.log('Bot started')
        client.load_command_folder('general', () => client.log('Successfully loaded general commands.'))
        client.load_command_folder('game', () => client.log('Successfully loaded game commands.'))
        client.load_command_folder('developer', () => client.log('Successfully loaded developer commands.'))
        client.connectDb(() => client.log('Database connected.'))
        client.user.setActivity(client.settings.activity, { type: 'Playing' }) 
    })

}