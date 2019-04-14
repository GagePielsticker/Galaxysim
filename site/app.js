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
web.app.set('views', web.path.join(__dirname, 'site/views'))
web.io.use(web.sharedsession(web.sess))

require('./site/lib/passport.js')(web)
require('./site/lib/socketio.js')(web)
require('./site/lib/routing.js')(web)

web.server.listen(80, () => {
    console.log('Started Web Server')
})