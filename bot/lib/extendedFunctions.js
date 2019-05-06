module.exports = client => {

    /**
     * Checks to see if a command exist in teh commands object on client
     * @param {String} arg
     * @returns {Boolean} true or false
     */
    client.commandExist = arg => {
        if(!client.commands[arg]) return false
        return true
    }

    //add commands as an empty object on client
    client.commands = {}

    /**
     * Insert folder name from commands/ and it will load all js files (commands) inside it
     * @param {String} folder
     * @returns {Promise} on success or fail
     */
    client.loadCommandFolder = folder => {    
        return new Promise(async (resolve, reject) => {
            client.fs.readdir(`./commands/${folder}/`, (err, files) => {
                if(err) return reject(`Error loading ${folder} commands : ${err}`)
                files.forEach(file => require(`../commands/${folder}/${file}`).load(client))
            })
            resolve()
        })
    }

    /**
     * Creates an error discord embed and sends
     * @param {Object} message Discords message event fire
     * @param {String} string
     */
    client.sendError = (message, string) => {
        let embed = new client.discord.MessageEmbed()
        .setTitle('Error')
        .setDescription(`${string}`)
        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
        .setTimestamp()
        .setColor(client.settings.embedColor)
        message.channel.send(embed)
    }

    /**
     * Creates a success discord embed and sends
     * @param {Object} message Discords message event fire
     * @param {String} string
     */
    client.sendSuccess = (message, string) => {
        let embed = new client.discord.MessageEmbed()
        .setTitle('Success')
        .setDescription(`${string}`)
        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
        .setTimestamp()
        .setColor(client.settings.embedColor)
        message.channel.send(embed)
    }

    /**
     * Creates a check discord embed, sends, and adds them to cooldown. ONLY FOR COLLECTOR CHECKS
     * @param {Object} message Discords message event fire
     * @param {String} string
     */
    client.sendCheck = (message, string) => {

        //create verification embed and send
        let embed = new client.discord.MessageEmbed()
        .setTitle('Verification')
        .setDescription(`${string}\nRespond \`yes\`/\`no\``)
        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
        .setTimestamp()
        .setColor(client.settings.embedColor)
        message.channel.send(embed)

        //Add user to collector cooldown and auto remove after timeout
        client.game.cooldowns.collector.push(message.author.id)
        setTimeout(() => {
            client.game.cooldowns.collector.splice(client.game.cooldowns.collector.indexOf(message.author.id), 1)
        }, client.settings.collectorTimeout * 1000)
    }

    /**
     * Pretty logs stuff
     * @param {String} string
     */
    client.log = string => console.log(`${client.moment().format('MMMM Do YYYY, h:mm:ss a')} :: ${string}`)

}