//bot dependencies and extending libraries
let Discord = require('discord.js')
let DBL = require('dblapi.js')
let client = new Discord.Client({shardCount: 'auto'})

//extended client library
client.moment = require('moment')
client.settings = require('./settings/settings.json')
client.ships = require('./settings/ships.json')
client.discord = Discord
client.fs = require('fs')
client.nameGenerator = require('project-name-generator')
client.cron = require('cron').CronJob
client.humanize = require('humanize-duration')
client.dbl = new DBL(client.settings.dbl_token, { webhookPort: 5000 })

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