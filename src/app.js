//bot dependencies and extending libraries
let Discord = require('discord.js')
let client = new Discord.Client
client.moment = require('moment')
client.settings = require('./bot/settings/settings.json')
client.ships = require('./bot/settings/ships.json')
client.discord = Discord
client.fs = require('fs')
client.name_generate = require('project-name-generator')
client.cron = require('cron').CronJob
client.humanize = require('humanize-duration')
const Chance = require('chance')
client.chance = new Chance()
let DBL = require('dblapi.js')

client.commands = {} 
client.cooldowns = {}
client.cooldowns.action = []
client.cooldowns.collector = []
client.cooldowns.mining = []
client.cooldowns.pvp = []

if(client.settings.dev_mode){
    client.settings.token = client.settings.beta_token 
    client.settings.prefix = client.settings.beta_prefix
}
client.dbl = new DBL(client.settings.dbl_token, { webhookPort: 5000 })

require('./bot/library/client_functions.js')(client)
require('./bot/library/client_events.js')(client)
require('./bot/library/db_functions.js')(client)
require('./bot/library/game_lib.js')(client)
require('./bot/library/dbl.js')(client)

//Website Dependencies and extended libraries
let web = {}
web.settings = require('./site/settings/settings.json')
web.express = require('express')
web.app = web.express()
web.server = require('http').createServer(web.app)
web.io = require('socket.io')(web.server)
web.passport = require('passport')
web.session = require('express-session')
web.sharedsession = require('express-socket.io-session')
web.path = require('path')
web.ejs = require('ejs')
web.discord_strategy = require('passport-discord').Strategy

if(client.settings.dev_mode) {web.settings.callback = web.settings.beta_callback}

web.sess = web.session({
    secret: 'Afjjj-fa08fo-fffw',
    resave: true,
    saveUninitialized: true,
    cookie: {
        expires: false,
        secure: "auto"
    }
})

web.app.use(web.sess)
web.app.use(web.passport.initialize())
web.app.use(web.passport.session())
web.app.set('view engine', 'ejs')
web.app.use(web.express.static(web.path.join(__dirname, 'site/public')))
web.app.set('views', web.path.join(__dirname, 'site/views'));
web.io.use(web.sharedsession(web.sess))

require('./site/lib/passport.js')(web, client)
require('./site/lib/socketio.js')(web, client)
require('./site/lib/routing.js')(web, client)

//Init
client.login(client.settings.token)

web.server.listen(80, () => {
    client.log('Started Web Server')
})