module.exports.load = client => {
    client.commands['scan'] = {
        settings : {
            type : 'game'
        },

        async run(message) {
            if(client.game.cooldowns.collector.includes(message.author.id)) return client.sendError(message, 'Please answer the current prompt.')
            if(client.game.cooldowns.warp.includes(message.author.id)) return client.sendError(message, 'You are currently warping.')

            //get profile, current system, and time taken to scan
            let system = await client.game.getCurrentSystem(message.author.id)
            let profile = await client.db.collection('users').findOne({id:message.author.id})
            let scanTime = Math.floor(system.planets.length * client.settings.game.planetScanTime / profile.ship.scannerSpeed)

            client.sendCheck(message, `You are about to scan the system which will take \`${client.humanize(scanTime * 1000)}\``)
            const collector = new client.discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: client.settings.collectorTimeout * 1000 })
            collector.on('collect', async message => {
                if (message.content.toLowerCase() == 'yes') {
                    let initScan = new client.discord.MessageEmbed()
                    .setTitle('Scan')
                    .setDescription(`Initiating scan...`)
                    .setTimestamp()
                    .setColor(client.settings.embedColor)
                    let init = await message.channel.send(initScan)
                    setTimeout(async () => {
                        init.delete()
                        let finishedScan = new client.discord.MessageEmbed()
                        .setTitle('Scan Results')
                        .setDescription(`Your scan has finished!`)
                        .addField('System Name', `\`${system.name}\``, true)
                        .addField('Controlling Alliance', `\`${system.controllingAlliance}\``, true)
                        .addField('Location (X|Y)', `\`${system.xPos}\`|\`${system.yPos}\``, true)
                        .addField('asteroids', `\`${system.asteroids}\``)
                        .setTimestamp()
                        .setColor(client.settings.embedColor)
                        await system.planets.forEach(async planet => {
                            if(planet.owner != null){
                                let u = await client.users.fetch(planet.owner)
                                finishedScan.addField(`${planet.name}`, `Resources: \`${planet.resources}\`\nPopulation: \`${planet.population}\`\nOwner: \`${u.username}#${u.discriminator}\``, true)
                            } else finishedScan.addField(`${planet.name}`, `Resources: \`${planet.resources}\`\nPopulation: \`${planet.population}\`\nOwner: \`None\``, true)
                        })
                        setTimeout(() => {
                            message.reply(finishedScan)
                        }, 50)
                        
                    }, scanTime * 1000)
                    client.game.cooldowns.collector.splice(client.game.cooldowns.collector.indexOf(message.author.id), 1)
                    collector.stop()
                }
                if (message.content.toLowerCase() == 'no') {
                    client.sendError(message, 'Action cancelled.')
                    client.game.cooldowns.collector.splice(client.game.cooldowns.collector.indexOf(message.author.id), 1)
                    collector.stop()
                }
            })
        }
    }
}