module.exports = client => {

    //on dbl webook ready
    client.dbl.webhook.on('ready', hook => {
        client.log(`DBL Webhook started on http://${hook.hostname}:${hook.port}${hook.path}`)
    })

    
    if(!client.settings.dev_mode){
        //try and post stats to dbl every x seconds
        setInterval(() => {
            try{
                let num = client.guilds.size + client.spoof
                client.dbl.postStats(num)
            } catch(e) {
                client.log('Couldnt post stats to DBL!')
            }
        }, client.settings.dbl_post_time * 1000)
    }
}