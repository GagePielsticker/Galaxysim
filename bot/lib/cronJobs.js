module.exports = client => {

    //population growth cron
    new client.cron('0 */12 * * * *', () => {

        //execute function
        client.game.generateColonyPopulation()

    }, null, true, 'America/Los_Angeles')
    
    
    //money growth cron
    new client.cron('0 */7 * * * *', () => {

        //execute function
        client.game.generateColonyMoney()

    }, null, true, 'America/Los_Angeles')
}