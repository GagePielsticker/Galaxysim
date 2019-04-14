module.exports = (web) => {

    web.passport.serializeUser(function(user, done) {
        done(null, user);
    })
    web.passport.deserializeUser(function(obj, done) {
        done(null, obj);
    })
    
    web.passport.use(new web.discord_strategy({
        clientID: web.settings.app_client_id,
        clientSecret: web.settings.app_client_secret,
        callbackURL: web.settings.callback,
        scope: web.settings.app_scopes
    },
    function(accessToken, refreshToken, profile, cb) {
        process.nextTick(function() {
            return cb(null, profile)
        })
    }))

}