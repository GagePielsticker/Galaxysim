module.exports = client => {

    //returns if message has correct prefix or not
    client.message_has_prefix = (message) => {
        if(!message.content.toLowerCase().startsWith(client.settings.prefix)) return false
        return true
    }

    //returns if command exist or not
    client.command_exist = (arg) => {
        if(!client.commands[arg]) return false
        return true
    }

    //loads every command file inside a specified folder then callsback on completion
    client.load_command_folder = async (folder, callback) => {      
        await client.fs.readdir(`./bot/commands/${folder}/`, (err, files) => {
            if(err) return client.log(`Error loading ${folder} commands : ${err}`)
            files.forEach(file => require(`../commands/${folder}/${file}`).load(client))
        })
        await callback()
    }

    //A quick way to send error messages to users
    client.send_error = (message, string) => {
        let embed = new client.discord.RichEmbed()
        .setTitle('Error')
        .setDescription(`${string}`)
        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
        .setTimestamp()
        .setColor(client.settings.embed_color)
        message.channel.send(embed)
    }

    //pretty logging stuff
    client.log = (string) => console.log(`${client.moment().format('MMMM Do YYYY, h:mm:ss a')} :: ${string}`)

}