module.exports = client => {
    
        /**
         * Creates and registers a new user account in database
         * @param {string} user
         * @returns {Promise} if completed or errored
         */
        client.create_user = user => {
            return new Promise((resolve, reject) => {
                if(!user) return reject('No user input.')
                let x_spawn = Math.floor(Math.random() * (client.settings.game.max_x - client.settings.game.min_x + 1)) + client.settings.game.min_x
                let y_spawn =  Math.floor(Math.random() * (client.settings.game.max_y - client.settings.game.min_y + 1)) + client.settings.game.min_y
                client.load_system_data(x_spawn, y_spawn, response => {
                    if(response == null) client.create_system(x_spawn, y_spawn)
                })
                let u = {
                    id : user,
                    beta_status : false,
                    x_pos: x_spawn,
                    y_pos: y_spawn,
                    credits: client.settings.game.starting_credits,
                    alliance: client.settings.game.starting_alliance,
                    ship: {
                        type: client.settings.game.starting_ship_type,
                        description: client.settings.game.starting_ship_description,
                        warp_speed: client.settings.game.starting_ship_warp,
                        max_warp_speed: client.settings.game.starting_ship_max_warp,
                        mining_speed: client.settings.game.starting_ship_mining,
                        max_mining_speed: client.settings.game.starting_ship_max_mining,
                        scanner_strength: client.settings.game.starting_scanner_strength,
                        max_scanner_strength: client.settings.game.starting_ship_max_scan,
                        att: client.settings.game.starting_ship_att,
                        def: client.settings.game.starting_ship_def,
                        max_cargo: client.settings.game.starting_max_cargo,
                        max_fuel: 100,
                        fuel: 100,
                        cargo: [],
                    },
                    colonies: []
                }
                client.write_user_data(user, u)
                resolve()
            })
        }
    
        /**
         * Creates a star system at x and y pos on map
         * @param {Integer} x_pos
         * @param {Integer} y_pos
         */
        client.create_system = (x_pos, y_pos) => {
            let obj = {
                name : client.name_generate({words : 2}).dashed,
                x_pos : x_pos,
                y_pos : y_pos,
                controlling_alliance : 'none',
                planets : [],
                npc_stations : [],
                player_stations : [],
                ships: [],
                astroids: Math.floor(Math.random() * client.settings.game.max_possible_astroids + 1)
            }
            
            for(let i = 0; i <= Math.floor(Math.random() * client.settings.game.max_possible_planets + 1); i++){
                obj.planets.push({
                    name : client.name_generate({ words: 1, number: true }).dashed,
                    x_pos : x_pos,
                    y_pos : y_pos,
                    resources : Math.floor(Math.random() * client.settings.game.max_possible_planet_resources + 1),
                    owner : null,
                    population : 0,
                    investments : 0
                })
            }
    
            client.log(`Generated system @ ${x_pos}-${y_pos} with ${obj.planets.length} planets`)
            client.write_system_data(x_pos, y_pos, obj)
        }
        
    
        /**
         * Creates an alliance for user (discord id)
         * @param {String} user
         * @param {String} name
         * @returns {Promise} on finish or error
         */
        client.create_alliance = (user, name) => {
            return new Promise((resolve, reject) => {
                if(!user) return reject('No user input.')
                if(!name) return reject('No name input.')
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
                if(!user) return reject('No user input.')
                if(!alliance_name) return reject('No alliance input.')
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
                if(!user) return reject('No user input.')
                if(!alliance_name) return reject('No alliance input.')
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
            return new Promise((resolve, reject) => {
                if(!user) return reject('No user input.')
                if(!alliance_name) return reject('No alliance input.')
                if(!Number.isInteger(amount)) return reject('Amount is not valid integer.')
                if(amount < 0) return reject('Amount is less than 0.')
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
                if(!alliance_name) return reject('No alliance input.')
                if(!target) return reject('No target input.')
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
                if(!alliance_name) return reject('No alliance input.')
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
                if(!alliance_name) return reject('No alliance input.')
                if(!description) return reject('No description input.')
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
         * @returns {Promise} On success or fail
         */
        client.move_user = (user, x_pos, y_pos) => {
            return new Promise((resolve, reject) => {
                if(!user) return reject('User not input.')
                if(!x_pos) return reject('X_pos not input.')
                if(!y_pos) return reject('Y_pos not input.')
                client.load_system_data(x_pos, y_pos, response => {
                    if(response == null) client.create_system(x_pos, y_pos)
                })
                client.load_user_data(user, response => {
                    if(user == null) return reject('User not in database.')
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
            return new Promise((resolve, reject) => {
                if(!user) return reject('User not input.')
                if(!amount) return reject('Amount not input.')
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
            if(!user) return reject('User not input.')
            if(!alliance_name) return reject('Alliance not input.')
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
            if(!user) return reject('User not input.')
            if(!alliance_name) return reject('Alliance not input.')
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
                if(!user) return reject('No user input.')
                if(!ship) return reject('No ship input.')
                let bought_ship = false
                client.ships.forEach(ent => {
                    if(ent.type == ship) bought_ship = ent
                })
                if(!bought_ship) return reject('Ship does not exist.')
                client.load_user_data(user, response => {
                    if(response.credits - bought_ship.cost < 0) return reject('User cannot afford ship.')
                    response.ship = bought_ship
                    client.write_user_data(user, response)
                    resolve()
                })
            })
        }

        /**
         * Colonizes planet for user
         * @param {String} user
         * @param {String} planet_name
         * @returns {Promise} On success or fail
         */
        client.colonize_planet = (user, planet_name) => {
            return new Promise((resolve, reject) => {
                
            })
        }

        /**
         * Invest money into a planet
         * @param {String} user
         * @param {String} planet_name
         * @param {String} amount
         * @returns {Promise} On success or fail
         */
        client.invest_planet = (user, planet_name, amount) => {
            return new Promise((resolve, reject) => {
                
            })
        }


        /**
         * Gets top users by colonies as an array
         * @param {Integer} amount
         * @returns {Promise} Array of objects of top users
         */
        client.top_users_by_col = amount => {
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
                if(client.cooldowns.mining.includes(user)) return reject('User still on mining cooldown.')
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
         * Scans a system
         * @param {String} user
         * @param {Integer} x_pos
         * @param {Integer} y_pos
         * @returns {Promise} On success the system object or fail
         */
        client.scan_system = (user, x_pos, y_pos) => {
            return new Promise((resolve, reject) => {
                
            })
        }

        /**
         * Attacks target
         * @param {String} user
         * @param {String} target
         * @returns {Promise} On success or fail with credits won or loss
         */
        client.pvp_attack = (user, target) => {
            return new Promise((resolve, reject) => {
                
            })
        }

        /**
         * Returns user to closest colony or 20 systems away
         * @param {String} user
         * @returns {Promise} On success or fail
         */
        client.return_user = (user) => {
            return new Promise((resolve, reject) => {
                
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
            return new Promise((resolve, reject) => {
                
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
                
            })
        }
}
