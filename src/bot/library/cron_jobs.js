module.exports = client => {

    //make sure these dont have same time frame
    //Loops through planets and grows their population based on investments every 6 mins
    let invesment_growth = new client.cron(`0 */14 * * * *`, () => {

        client.load_user_data('*', user_res => {
            user_res.forEach(async doc => {
                await doc.colonies.forEach(col => {

                    let population_growth = Math.floor(col.investments / 4 / 4 / 3 * .5)
                    if(col.population + population_growth > client.settings.game.max_population){
                        col.population = client.settings.game.max_population
                    } else {
                        col.population += population_growth
                    }
                    client.load_system_data(col.x_pos, col.y_pos, async sys_res => {
                        await sys_res.planets.forEach(planet => {
                            if(planet.name == col.name) planet.population += population_growth
                        })
                        await client.write_system_data(col.x_pos, col.y_pos, sys_res)
                    })
                })

                await client.write_user_data(doc.id, doc)
            })
        })
        client.log('Populations Updated')

    }, null, true, 'America/Los_Angeles')

    //Loops through planets and gains user credits based on resources and populations
    let colony_wealth_generation = new client.cron(`0 */6 * * * *`, () => {
        client.load_user_data('*', user_res => {
            user_res.forEach(async doc => {
                await doc.colonies.forEach(colony => {
                    let p1 = colony.population / 3
                    let p2 = p1 * colony.resources
                    let profit = Math.floor(p2 / 30)
                    doc.credits += profit
                })
                await client.write_user_data(doc.id, doc)
            })
        })
        client.log('Generated Colony Credits')

    }, null, true, 'America/Los_Angeles')

}