module.exports.load = client => {
    client.commands['user'] = {
        settings : {
            type : 'game',
            description : 'See your user information.',
            usage : `${client.settings.prefix}user`
        },

        async run(message) {
            let user = await client.db.collection('users').findOne({id:message.author.id})
            let embed = await new client.discord.MessageEmbed()
            embed.setTitle('User')
            embed.setDescription('This page contains general user information for your player.')
            if(user.contributer){
                embed.setThumbnail('https://i.imgur.com/NYTX41m.png')
            }
            if(user.spaceExplorer){
                embed.setThumbnail('https://i.imgur.com/ZrKtaeN.png')
            }
            if(user.cosmonaut){
                embed.setThumbnail('https://i.imgur.com/7a10gp4.png')
            }
            embed.addField('Position X|Y', `\`${user.xPos} | ${user.yPos}\``, true)
            embed.addField('Credits', `\`${user.credits.toLocaleString()}\``, true)
            embed.addField('Bounty', `\`${user.bounty}\``, true)
            if(user.alliance == null) embed.addField('Alliance', `\`none\``, true)
            else embed.addField('Alliance', `\`${user.alliance}\``, true)
            embed.addField('Colonies', `\`${user.colonies.length}\``, true)
            embed.addField('Ship Type', `\`${user.ship.type}\``, true)
            embed.addField('Ship Attack', `\`${user.ship.attack}/${user.ship.maxAttack}\``, true)
            embed.addField('Ship Defense', `\`${user.ship.defense}/${user.ship.maxDefense}\``, true)
            embed.addField('Ship Mining Strength', `\`${user.ship.miningSpeed}/${user.ship.maxMiningSpeed}\``, true)
            embed.addField('Ship Warp Speed', `\`${user.ship.warpSpeed}/${user.ship.maxWarpSpeed}\``, true)
            embed.addField('Ship Scan Strength', `\`${user.ship.scannerSpeed}/${user.ship.maxScannerSpeed}\``, true)
            embed.addField('Ship Fuel', `\`${user.ship.fuel}/${user.ship.maxFuel}\``, true)
            embed.addField('Ore Storage', `\`${user.ship.oreStorage}\`/\`${user.ship.oreStorageMax}\``, true)
            embed.setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
            embed.setTimestamp()
            embed.setColor(client.settings.embedColor)
            await message.channel.send(embed)
        }
    }
}