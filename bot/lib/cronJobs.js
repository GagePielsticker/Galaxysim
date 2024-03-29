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
        client.game.generateBotOre()

    }, null, true, 'America/Los_Angeles')

    //daily asteroid regen
    let d = new client.cron('0 0 4 * * *', () => {

        //execute function
        client.game.regenerateAsteroids()
        .then(() => client.log('generated asteroids'))

    }, null, true, 'America/Los_Angeles')
}