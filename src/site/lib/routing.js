module.exports = (web, client) => {
    web.app.get('/', (req, res) => {
        res.render('index', {auth_state : req.isAuthenticated()})
    })

    web.app.get('/dashboard', is_auth_middleware, (req, res) => {
        res.render('dashboard')
    })

    web.app.get('/login', web.passport.authenticate('discord'))

    web.app.get('/auth/callback', web.passport.authenticate('discord', {
        failureRedirect: '/'
    }), function(req, res) {
        res.redirect('/dashboard')
    })

    web.app.get('/auth/logout', is_auth_middleware, (req, res) => {
        req.session.destroy((err) => {
            res.redirect('/')
        })
    })

    function is_auth_middleware(req, res, next) {
        if (req.isAuthenticated()) return next()
        res.redirect('/')
      }
      
}