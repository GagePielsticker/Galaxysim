module.exports = client => {
    
        /**
         * Creates an alliance for user (discord id)
         * @param {String} user
         * @param {String} name
         * @returns {Promise} on finish or error
         */
        client.create_alliance = (user, name) => {
            return new Promise((resolve, reject) => {
                let a = {
                    name : name,
                    owner_id : user,
                    description : 'none',
                    credits : 0,
                    tax : 0,
                    trade_routes : [],
                    home_system_x : 0,
                    home_system_y : 0,
                    members : [],
                    join_req : []
                }
                client.write_alliance_data(name, a)
                resolve()
            })
        }

        /**
         * Joins user to alliance
         * @param {String} user
         * @param {String} alliance_name
         * @returns {Promise} On success or fail
         */
        client.join_alliance = (user, alliance_name) => {
            return new Promise((resolve, reject) => {
                client.load_alliance_data(alliance_name, response => {
                    if(response == null) return reject('Alliance with that name doesn\'t exist.')
                    if(response.join_req.includes(user)) return reject('User already applied for alliance.')
                    response.join_req.push(user)
                    client.write_alliance_data(alliance_name, response)
                    resolve()
                })
            })
        }

        /**
         * Leaves user from alliance
         * @param {String} user
         * @returns {Promise} On success or fail
         */
        client.leave_alliance = (user) => {
            return new Promise((resolve, reject) => {
                client.load_user_data(user, user_response => {
                    if(user_response.alliance = null) return reject('User not in an alliance.')
                    client.load_alliance_data(user_response.alliance, alliance_response => {
                        if(alliance_response.owner_id == user) {
                            client.disband_alliance(user_response.alliance)
                            resolve()
                        } else {
                            alliance_response.members.splice(alliance_response.members.indexOf(user), 1)
                            user_response = null
                            client.write_user_data(user, user_response)
                            client.write_alliance_data(user_response.alliance, alliance_response)
                            resolve()
                        }
                    })
                })
            })
        }

        /**
         * Invest money in alliance
         * @param {String} user
         * @param {Integer} amount
         * @param {String} alliance_name
         * @returns {Promise} On success or fail
         */
        client.invest_alliance = (user, amount, alliance_name) => {
            if(!Number.isInteger(amount)) return reject('Amount is not valid integer.')
            if(amount < 0) return reject('Amount is less than 0.')
            return new Promise((resolve, reject) => {
                client.load_user_data(user, user_response => {
                    if(user_response.credits - amount < 0) return reject('User can\'t afford this.')
                    client.load_alliance_data(alliance_name, alliance_response => {
                        if(alliance_response == null) return reject('Alliance doesn\'t exist.')
                        user_response -= amount
                        alliance_response += amount
                        client.write_user_data(user, user_response)
                        client.write_alliance_data(alliance_name, alliance_response)
                        resolve()
                    })
                })
            })
        }

        /**
         * Kicks target from alliance
         * @param {String} alliance_name
         * @param {String} target
         * @returns {Promise} On success or fail
         */
        client.kick_alliance = (alliance_name, target) => {
            return new Promise((resolve, reject) => {
                client.load_alliance_data(alliance_name, alliance_response => {
                    if(alliance_response == null) return reject('Alliance doesn\'t exist.')
                    if(!alliance_response.members.includes(target)) return reject('Target not in alliance.')
                    client.leave_alliance(target)
                    resolve()
                })
            })
        }

        /**
         * Disbands an alliance
         * @param {String} alliance_name
         * @returns {Promise} On success or fail
         */
        client.disband_alliance = (alliance_name) => {
            return new Promise((resolve, reject) => {
                client.load_alliance_data(alliance_name, alliance_response => {
                    if(alliance_response == null) return reject('Alliance doen\'t exist')
                    alliance_response.membersforEach(member => {
                        client.load_user_data(user_response => {
                            user_response.alliance = null
                            client.write_user_data(member, user_response)
                        })
                        client.load_user_data(alliance_response.owner_id, user_response => {
                            user_response.alliance = null
                            client.write_user_data(alliance_response.owner_id, user_response)
                        })
                        client.delete_alliance_data(alliance_name)
                        resolve()
                    })
                })
            })
        }

        /**
         * Sets alliance description
         * @param {String} user
         * @param {String} alliance_name
         * @param {String} description
         * @returns {Promise} On success or fail
         */
        client.description_alliance = (alliance_name, description) => {
            return new Promise((resolve, reject) => {
                client.load_alliance_data(alliance_name, response => {
                    response.description = description
                    client.write_alliance_data(alliance_name, response)
                    resolve()
                })
            })
        }

        /**
         * Moves user to system
         * @param {String} user
         * @param {Integer} x_pos
         * @param {Integer} y_pos
         * @param {Integer} fuel_used
         * @returns {Promise} On success or fail
         */
        client.move_user = (user, x_pos, y_pos, fuel_used) => {     
            return new Promise((resolve, reject) => {
                if(x_pos > client.settings.game.max_x || x_pos < client.settings.game.min_x) return reject('Target outside of boundries.')
                if(y_pos > client.settings.game.max_x || y_pos < client.settings.game.min_x) return reject('Target outside of boundries.')
                
                client.load_system_data(x_pos, y_pos, response => {
                    if(response == null) client.create_system(x_pos, y_pos)
                })

                client.load_user_data(user, response => {
                    if(user == null) return reject('User not in database.')
                    if(response.ship.fuel - fuel_used < 0) return reject('User does not have enough fuel.')
                    response.ship.fuel -= fuel_used
                    response.x_pos = x_pos
                    response.y_pos = y_pos
                    client.write_user_data(user, response)
                    resolve()
                })
            })
        }

        /**
         * Rewards user with credits
         * @param {String} user
         * @param {Integer} amount
         * @returns {Promise} On success or fail
         */
        client.reward = (user, amount) => {
            if(!Number.isInteger(amount)) return reject('Amount is not valid integer.')
            if(amount < 0) return reject('Amount is less than 0.')
            return new Promise((resolve, reject) => {
                client.load_user_data(user, response => {
                    if(response == null) return reject('User not in database.')
                    response.credits += amount
                    client.write_user_data(user, response)
                    resolve()
                })
            })
        }

        /**
         * Moves user into alliance and removes application
         * @param {String} target
         * @param {String} alliance_name
         * @returns {Promise} On success or fail
         */
        client.add_alliance = (target, alliance_name) => {
            return new Promise((resolve, reject) => {
                client.load_alliance_data(alliance_name, alliance_response => {
                    if(alliance_response == null) return reject('Alliance doesnt exist.')
                    //if they already applied remove their application
                    if(alliance_response.join_req.includes(target)) {
                        ally_response.join_req.splice(alliance_response.join_req.indexOf(target), 1)
                    }
                    //push them into the members array
                    ally_response.members.push(target)

                    client.load_user_data(target, user_response => {
                        //if they are in alliance remove them from it
                        if(user_response.alliance != null) {
                            client.leave_alliance(target)
                            .catch(e => reject(e))
                            .then(() => {
                                user_response.alliance = alliance_name
                                client.write_user_data(target, user_response)
                            })
                        } else {
                            user_response.alliance = alliance_name
                            client.write_user_data(target, user_response)
                        }
                    })

                    //save data
                    client.write_alliance_data(alliance_name, alliance_response)
                    resolve()
                })
            })
        }

        /**
         * Removes application from alliance
         * @param {String} target
         * @param {String} alliance_name
         * @returns {Promise} On success or fail
         */
        client.deny_alliance = (target, alliance_name) => {
            return new Promise((resolve, reject) => {
                client.load_alliance_data(alliance_name, alliance_response => {
                    if(alliance_response == null) return reject('Alliance doesnt exist.')
                    if(!alliance_response.join_req.includes(target)) return reject('User has not applied to alliance.')
                    ally_response.join_req.splice(alliance_response.join_req.indexOf(target), 1)
                    client.write_alliance_data(alliance_name, alliance_response)
                    resolve()
                })
            })
        }

        /**
         * Buys ship for user
         * @param {String} user
         * @param {String} ship
         * @returns {Promise} On success or fail
         */
        client.buy_ship = (user, ship) => {
            return new Promise((resolve, reject) => {
                let bought_ship = false
                client.ships.forEach(ent => {
                    if(ent.type == ship) bought_ship = ent
                })
                if(!bought_ship) return reject('Ship does not exist.')
                client.load_user_data(user, response => {
                    if(response.credits - bought_ship.cost < 0) return reject('User cannot afford ship.')
                    response.ship = bought_ship
                    response.credits -= bought_ship.cost
                    client.write_user_data(user, response)
                    resolve()
                })
            })
        }

        /**
         * Invest money into a planet
         * @param {String} user
         * @param {String} planet_name
         * @param {Integer} amount
         * @returns {Promise} On success or fail
         */
        client.invest_planet = (user, planet_name, amount) => {
            if(!Number.isInteger(amount)) return reject('Amount is not valid integer.')
            if(amount < 0) return reject('Amount is less than 0.')
            return new Promise((resolve, reject) => {
                client.load_user_data(user, user_response => {
                    if(user_response.credits - amount < 0) return reject('User cannot afford this.')
                    user_response.colonies.forEach(col => {
                        if(col.name == planet_name) {
                            
                            //do investment stuff
                            col.investments += amount
                            user_response.credits -= amount

                            //load system
                            client.load_system_data(col.x_pos, col.y_pos, system_response => {
                                system_response.planets.forEach(planet => {
                                    if(planet.name == planet_name) {
                                        planet.investments += amount
                                        client.write_system_data(col.x_pos, col.x_pos, system_response)
                                    }
                                })
                            })

                            //save user data
                            client.write_user_data(user, user_response)

                            resolve()
                        }
                    })
                })
            })
        }


        /**
         * Gets top users by colonies as an array
         * @param {Integer} amount
         * @returns {Promise} Array of objects of top users
         */
        client.top_users_by_col = amount => {
            if(!Number.isInteger(amount)) return reject('Amount is not valid integer.')
            if(amount < 0) return reject('Amount is less than 0.')
            return new Promise((resolve, reject) => {
                client.load_user_data('*', data => {
                    data.toArray()
                    .then(async r => {
                        let leaderboard = []
                        await r.forEach(doc => {
                            leaderboard.push(`${doc.id}|${doc.colonies.length}`)
                        })
                        await leaderboard.sort((a, b) => {
                            a = a.split('|').splice(1).join('')
                            b = b.split('|').splice(1).join('')
                            return b - a
                        })
                        leaderboard.length = amount
                        let output = []
                        await leaderboard.forEach(ent => {
                            let a = ent.split('|')
                            output.push({
                                id: a[0],
                                colonies: a[1]
                            })
                        })
                        await resolve(output)
                    })
                })
            })
        }

        /**
         * Mines astroids in system
         * @param {String} user
         * @returns {Promise} On success the credits generated or fail
         */
        client.mine_system = user => {
            return new Promise((resolve, reject) => {
                client.load_user_data(user, user_response => {
                    client.load_system_data(user_response.x_pos, user_response.y_pos, async system_response => {
                        if(system_response.astroids == 0) return reject('There are no astroids in the system.')
                        let astroids_mined = user_response.ship.mining_speed * client.settings.game.base_mining_multiplier
                        if(system_response.astroids - astroids_mined < 0) {system_response.astroids = 0}
                        else {system_response.astroids -= astroids_mined}
                        let profits = Math.floor(astroids_mined * client.settings.game.astroid_cost)
                        user_response.credits += profits
                        client.write_user_data(user, user_response)
                        client.write_system_data(user_response.x_pos, user_response.y_pos, system_response)
                        resolve(profits)
                    })
                })
            })
        }

        /**
         * Get a system
         * @param {Integer} x_pos
         * @param {Integer} y_pos
         * @returns {Promise} On success the system object or fail
         */
        client.get_system = (x_pos, y_pos) => {
            return new Promise((resolve, reject) => {
                client.load_system_data(x_pos, y_pos, response => {
                    if(response == null) return reject('System does not exist.')
                    resolve(response)
                })
            })
        }

        /**
         * Returns user to closest colony or 20 systems away
         * @param {String} user
         * @returns {Promise} On success or fail boolean
         */
        client.return_user = (user) => {
            return new Promise((resolve, reject) => {
                let pos = {
                    x: null,
                    y: null
                }
                let base_dist = Number.MAX_SAFE_INTEGER
                client.load_user_data(user, async response => {
                    await response.colonies.forEach(colony => {
                        let temp_dist = distance(response.x_pos, response.y_pos, colony.x_pos, colony.y_pos)
                        if(temp_dist < base_dist) {
                            dist = temp_dist
                            pos.x = colony.x_pos
                            pos.y = colony.y_pos
                        }
                    })
                    if(pos.x == null || pos.y == null) return resolve(false)
                    response.x_pos = pos.x
                    response.y_pos = pos.y
                    client.write_user_data(user, response)
                    resolve(true)

                })
                function distance(x1, y1, x2, y2) {
                    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
                }
            })
        }

        /**
         * Upgrades a users ship
         * @param {String} type
         * @param {String} user
         * @param {Integer} amount
         * @returns {Promise} On success or fail
         */
        client.upgrade_ship = (type, user, amount) => {
            if(!Number.isInteger(amount)) return reject('Amount is not valid integer.')
            if(amount < 0) return reject('Amount is less than 0.')
            return new Promise((resolve, reject) => {
                client.load_user_data(user, async response => {
                    let upgrade = ''
                    switch(type) {
                        case 'mining' :
                            upgrade = 'mining_speed'
                            break
                        case 'warp' :
                            upgrade = 'warp_speed'
                            break
                        case 'scan' :
                            upgrade = 'scanner_strength'
                            break
                        case 'fuel' :
                            upgrade = 'max_fuel'
                            break
                        case 'attack' :
                            upgrade = 'att'
                            break
                        case 'defense' :
                            upgrade = 'def'
                            break
                    }
                    if(upgrade == '') return reject('Invalid type.')
                    response.ship[upgrade] += amount
                    client.write_user_data(user, response)
                    resolve()
                })
            })
        }

        /**
         * Fetch a colony object
         * @param {String} colony_name
         * @param {String} user
         * @returns {Promise} On success returns colony object, or fail
         */
        client.user_colony = (colony_name, user) => {
            return new Promise((resolve, reject) => {
                client.load_user_data(user, response => {
                    let col = false
                    response.colonies.forEach(colony => {
                        if(colony.name == colony_name) col = colony
                    })
                    if(!col) return reject('No colony found.')
                    resolve(col)
                })
            })
        }
}
