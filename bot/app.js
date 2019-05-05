//bot dependencies and extending libraries
let Discord = require('discord.js')
let DBL = require('dblapi.js')
let client = new Discord.Client({shardCount: 'auto'})
let Boat = require('discordboats.xyz')

//extended client library
client.moment = require('moment')
client.settings = require('./settings/settings.json')
client.ships = require('./settings/ships.json')
client.discord = Discord
client.fs = require('fs')
client.nameGenerator = require('project-name-generator')
client.cron = require('cron').CronJob
client.humanize = require('humanize-duration')
client.dbl = new DBL(client.settings.dblToken, { webhookPort: 5000 })
client.boat = new Boat('541536124326117387', 'JLGUGTkxOw0dOzNnyNaO8SK3o7rTgx7n7h79CTS6YT9u13TTTIwqkdMJtL5j2BT2CUtAUEb31A3If2KcNkBCCPy62rrVt3LwRrYEIipV2CBy7j58yIrSVQdXTLsCCW8AM6T5G4UfNbVXOG2cGr15v30TOSN')

//devMode state check
if(client.settings.devMode){
    client.settings.token = client.settings.betaToken 
    client.settings.prefix = client.settings.betaPrefix
}

//Custom libraries
require('./lib/events.js')(client)
require('./lib/extendedFunctions.js')(client)
require('./lib/game.js')(client)
require('./lib/dbl.js')(client)
require('./lib/database.js')(client)
require('./lib/cronJobs.js')(client)

//init bot and server
client.login(client.settings.token)
