module.exports = client => {

    //population growth cron
    let a = new client.cron('0 */13 * * * *', () => {

        //execute function
        client.game.generateColonyPopulation()

    }, null, true, 'America/Los_Angeles')
    
    
    //money growth cron
    let b = new client.cron('0 */7 * * * *', () => {

        //execute function
        client.game.generateColonyMoney()

    }, null, true, 'America/Los_Angeles')

    //ore from bots
    let c = new client.cron('0 */3 * * * *', () => {

        //execute function
        client.game.generateBotMoney()

    }, null, true, 'America/Los_Angeles')
}