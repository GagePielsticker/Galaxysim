module.exports = client => {

    /**
     * Take hook boject on dbl webhook ready
     * @param {Object} hook
     */
    client.dbl.webhook.on('ready', hook => {
        client.log(`DBL Webhook started on http://${hook.hostname}:${hook.port}${hook.path}`)
    })

    /**
     * If bot state is not in dev_mode then post stats to dbl
     */
    if(!client.settings.devMode){
        setInterval(() => {
            try{
                client.dbl.postStats(client.guilds.size)
            } catch(e) {
                client.log('Couldnt post stats to DBL')
            }

            client.boat.postStats(client.guilds.size, '541536124326117387').then(() => {
                client.log('Successfully updated server count.')
            }).catch((e) => {
                client.error(e)
            })
        }, client.settings.DBLTimer * 1000)
    }
}