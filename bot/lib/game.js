module.exports = client => {

    //setup game object on client
    client.game = {}

    //setup empty cooldown arrays
    client.game.cooldowns = {
        collector : [],
        warp : [],
        mining : [],
        processing : []
    }

    /**
     * Creates a game account for user and saves to database
     * @param {String} user
     * @returns {Promise}
     */
    client.game.createAccount = user => {
        return new Promise(async (resolve, reject) => {

            //Create random spawn cords
            let xSpawn = await Math.floor(Math.random() * (client.settings.game.map.maxX - client.settings.game.map.minX + 1)) + client.settings.game.map.minX
            let ySpawn = await Math.floor(Math.random() * (client.settings.game.map.maxY - client.settings.game.map.minY + 1)) + client.settings.game.map.minY
            
            //check if system exist if not create
            let spawnSystem = await client.db.collection('map').findOne({xPos:xSpawn, yPos:ySpawn})
            if(spawnSystem == null) {
                await client.game.createSystem(xSpawn, ySpawn)
            }

            //Create and save user object
            await client.db.collection('users').update({id:user}, {
                id : user,
                xPos: xSpawn,
                yPos: ySpawn,
                credits: client.settings.game.startingCredits,
                alliance: client.settings.game.startingAlliance,
                ship: client.settings.game.startingShip,
                contributer: false,
                spaceExplorer: false,
                cosmonaut:false,
                bounty: client.settings.game.startingBounty,
                colonies: []
            }, {upsert:true})
            .then(async () => {
                let profile = await client.users.fetch(user, true)
                client.log(`Created user for ${profile.username}#${profile.discriminator}`)
                resolve()
            })
        })
    }

    /**
     * Creates a star system and saves to database
     * @param {Integer} xPos
     * @param {Integer} yPos
     * @returns {Promise}
     */
    client.game.createSystem = (xPos, yPos) => {
        return new Promise((resolve, reject) => {
            //Create system object
            let system = {
                name : client.nameGenerator({words : 2}).dashed,
                xPos : xPos,
                yPos : yPos,
                controllingAlliance : 'none',
                planets : [],
                npcStations : [],
                playerStations : [],
                ships: [],
                asteroids: Math.floor(Math.random() * client.settings.game.system.maxAsteroids + 1)
            }

            //Fill system with planets
            for(let i = 0; i <= Math.floor(Math.random() * client.settings.game.system.maxPlanets + 1); i++){
                system.planets.push({
                    name : client.nameGenerator({ words: 1, number: true }).dashed,
                    xPos : xPos,
                    yPos : yPos,
                    resources : Math.floor(Math.random() * client.settings.game.planet.maxResources + 1),
                    owner : null,
                    population : 0,
                    wallet : 0,
                    oreStorage : 0,
                    miningBots : 0,
                    colonizedAt : null
                })
            }

            //Log and save
            client.db.collection('map').update({xPos:xPos, yPos:yPos}, system, {upsert:true})
            .then(() => {
                client.log(`Generated system @ ${xPos}-${yPos} with ${system.planets.length} planets`)
                resolve()
            })
        })
    }

    /**
     * Add property to all planets
     * @param {String} prop
     * @param {ANY} val
     * @returns {Promise}
     */
    client.game.addPlanetProperty = (prop, val) => {
        return new Promise(async (resolve, reject) => {
            let galaxy = await client.db.collection('map').find({}).toArray()
            let users = await client.db.collection('users').find({}).toArray()
            //loop through each system regenerating the asteroids
            await galaxy.forEach(async system => {
                await system.planets.forEach(planet => {
                    planet[prop] = val
                    console.log(planet.name)
                })
                await client.db.collection('map').update({xPos:system.xPos, yPos:system.yPos}, system)
            })

            await users.forEach(async user => {
                await user.colonies.forEach(async colony => {
                    colony[prop] = val
                })
                await client.db.collection('users').update({id:user.id}, user)
            })

            await resolve()
        })
    }

    /**
     * Creates an alliance for user (discord id)
     * @param {String} user
     * @param {String} name
     * @returns {Promise}
     */
    client.game.createAlliance = (owner, allianceName) => {
        return new Promise(async (resolve, reject) => {

            //check if user already in alliance
            let user = await client.db.collection('users').findOne({id: owner})
            if(user.alliance != null) return reject('User already in alliance.')

            //check if alliance already exist
            let check = await client.db.collection('alliances').findOne({name: allianceName})
            if(check != null) return reject('Alliance already exist.')

            //check if user can afford it
            if(user.credits - client.settings.game.alliance.creationCost < 0) return reject(`User cannot afford to create an alliance. The current cost is ${client.settings.game.alliance.creationCost} credits.`)

            //update user data
            user.alliance = allianceName
            user.credits -= client.settings.game.alliance.creationCost
            
            //save user data
            client.db.collection('users').update({id:owner}, user)

            //insert new alliance into database
            await client.db.collection('alliances').insert({
                name: allianceName,
                owner: owner,
                description: 'No Description Set.',
                credits: 0,
                tax: 0,
                homeSystemX: 0,
                homeSystemY: 0,
                members: [],
                treaties: [],
                joinRequest: []
            }, {upsert:true})
            .then(() => {
                client.log(`Alliance ${allianceName} created.`)
                resolve()
            })
        })
    }

    /**
     * Removes member from alliance
     * @param {String} user
     * @returns {Promise}
     */
    client.game.leaveAlliance = user => {
        return new Promise(async (resolve, reject) => {

            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //if they arent in an alliance reject
            if(profile.alliance == null) return reject('User not in an alliance.')

            //load alliance profile
            let alliance = await client.db.collection('alliances').findOne({name:profile.alliance})

            //check if alliance exist
            if(alliance == null) return reject('Alliance doesnt exist.')

            //if they own the alliance reject
            if(alliance.owner == user) return reject('User is owner of alliance and must disband it to leave.')

            //remove user from members list
            alliance.members.splice(alliance.members.indexOf(user), 1)

            //save data
            await client.db.collection('alliances').update({name:alliance.name}, alliance)
            await client.db.collection('users').update({id:user}, {$set:{alliance:null}})
            await resolve()
        })
    }

    /**
     * Disbands a users alliance
     * @param {String} user
     * @returns {Promise}
     */
    client.game.disbandAlliance = user => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //if they arent in an alliance reject
            if(profile.alliance == null) return reject('User not in an alliance.')

            //load alliance profile
            let alliance = await client.db.collection('alliances').findOne({name:profile.alliance})

            //check if alliance exist
            if(alliance == null) return reject('Alliance doesnt exist.')

            //if they do not own the alliance reject
            if(alliance.owner != user) return reject('User is not owner of alliance.')

            //reset all members data to default alliance
            await alliance.members.forEach(member => {
                client.db.collection('users').update({id: member}, {$set:{alliance:null}})
            })

            //save data and delete alliance
            await client.db.collection('users').update({id:user}, {$set:{alliance:null}})
            await client.db.collection('alliances').remove({name:alliance.name})

            await resolve()
        })
    }

    /**
     * Sets alliance description
     * @param {String} user
     * @param {String} string
     * @returns {Promise}
     */
    client.game.setAllianceDescription = (user, string) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //if they arent in an alliance reject
            if(profile.alliance == null) return reject('User not in an alliance.')

            //easter egg for grig
            if(string == '1') return reject('Grig was here :p')

            //load alliance profile
            let alliance = await client.db.collection('alliances').findOne({name:profile.alliance})

            //check if alliance exist
            if(alliance == null) return reject('Alliance doesnt exist.')

            //if they do not own the alliance reject
            if(alliance.owner != user) return reject('User is not owner of alliance.')

            //check if string exceeds max character limit
            if(string.length > client.settings.game.alliance.maxDescriptionCharacters) return reject(`Description too long, limit is ${client.settings.game.alliance.maxDescriptionCharacters} characters.`)

            //save description
            await client.db.collection('alliances').update({name:alliance.name}, {$set:{description:string.replace(/\n/g, " ")}})
            .then(() => resolve())
        })
    }

    /**
     * Sets alliance tax
     * @param {String} user
     * @param {Interval} amount
     * @returns {Pormise}
     */
    client.game.setAllianceTax = (user, amount) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //if they arent in an alliance reject
            if(profile.alliance == null) return reject('User not in an alliance.')

            //load alliance profile
            let alliance = await client.db.collection('alliances').findOne({name:profile.alliance})

            //check if alliance exist
            if(alliance == null) return reject('Alliance doesnt exist.')

            //if they do not own the alliance reject
            if(alliance.owner != user) return reject('User is not owner of alliance.')

            //check if tax is integer
            if(!Number.isInteger(amount)) return reject('Tax must be an integer.')

            //make sure it only goes to 100 percent and no negative tax
            if(amount > 100 || amount < 0) return reject('Tax rate must be between 0-100')

            //set tax from 0 -> 1
            let finalTax = amount / 100

            //save to database
            await client.db.collection('alliances').update({name:alliance.name}, {$set:{tax:finalTax}})
            .then(() => {
                resolve()
            })
        })
    }

    /**
     * Fetches users alliance object
     * @param {String} user
     * @returns {Promise}
     */
    client.game.getUserAlliance = (user) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //if they arent in an alliance reject
            if(profile.alliance == null) return reject('User not in an alliance.')

            //load alliance profile
            let alliance = await client.db.collection('alliances').findOne({name:profile.alliance})

            //check if alliance exist
            if(alliance == null) return reject('Alliance doesnt exist.')

            await resolve(alliance)
        })
    }
    

    /**
     * Kicks user from alliance
     * @param {String} user
     * @param {String} target
     * @returns {Promise}
     */
    client.game.kickFromAlliance = (user, target) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //if they arent in an alliance reject
            if(profile.alliance == null) return reject('User not in an alliance.')

            //load alliance profile
            let alliance = await client.db.collection('alliances').findOne({name:profile.alliance})

            //check if alliance exist
            if(alliance == null) return reject('Alliance doesnt exist.')

            //if they do not own the alliance reject
            if(alliance.owner != user) return reject('User is not owner of alliance.')

            //check if they are trying to kick themself.
            if(user == target) return reject('You cannot kick yourself.')

            //check if target is in alliance
            if(!alliance.members.includes(target)) return reject('Target is not in alliance')

            //remove user from members array
            await alliance.members.splice(alliance.members.indexOf(target), 1)

            //save data
            await client.db.collection('alliances').update({name:alliance.name}, alliance)
            await client.db.collection('users').update({id:target}, {$set:{alliance:null}})
            
            //resolves
            await resolve()
        })
    }


    /**
     * Invest a users credits into their alliance
     * @param {String} user
     * @param {Integer} amount
     * @returns {Promise}
     */
    client.game.investToAlliance = (user, amount) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //if they arent in an alliance reject
            if(profile.alliance == null) return reject('User not in an alliance.')

            //load alliance profile
            let alliance = await client.db.collection('alliances').findOne({name:profile.alliance})

            //check if alliance exist
            if(alliance == null) return reject('Alliance doesnt exist.')
            
            //check if investment is integer and is above 0
            if(!Number.isInteger(amount) || amount < 0) return reject('Invested amount invalid.')

            //check if user can afford action
            if(profile.credits - amount < 0) return reject('User cannot afford this.')

            //set new values
            alliance.credits += amount
            profile.credits -= amount

            //save data
            await client.db.collection('alliances').update({name:alliance.name}, alliance)
            await client.db.collection('users').update({id:user}, profile)

            //resolve
            await resolve()
        })
    }

    /**
     * Invest users credits into colony
     * @param {String} user
     * @param {String} colony
     * @param {Integer} amount
     */
    client.game.investToColony = (user, colony, amount) => {
        return new Promise(async (resolve, reject) => {

            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //check if investment is integer and is above 0
            if(!Number.isInteger(amount) || amount < 0) return reject('Invested amount invalid.')

            //check if user can afford action
            if(profile.credits - amount < 0) return reject('User cannot afford this.')

            //check if colony exist
            let cSearch
            await profile.colonies.forEach(col => {
                if(col.name == colony) cSearch = col
            })
            if(!cSearch) return reject('A colony with that name does not exist.')

            //add investment to colony on profile
            await profile.colonies.forEach(col => {
                if(col.name == colony) {
                    col.wallet += amount
                }
            })

            //load system data
            let system = await client.db.collection('map').findOne({xPos: cSearch.xPos, yPos: cSearch.yPos})

            //add investment to colony on system
            await system.planets.forEach(planet => {
                if(planet.name == colony) {
                    planet.wallet += amount
                }
            })

            //set new values
            profile.credits -= amount

            //save data
            await client.db.collection('users').update({id:user}, profile)
            await client.db.collection('map').update({xPos: cSearch.xPos, yPos: cSearch.yPos}, system)

            //resolve
            await resolve()
        })
    }

    /**
     * Get array of alliance members (restricted by settings)
     * @param {String} user
     * @param {Integer} page
     * @returns {Promise} Array
     */
    client.game.getAllianceMembersList = (user, page) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //if they arent in an alliance reject
            if(profile.alliance == null) return reject('User not in an alliance.')

            //load alliance profile
            let alliance = await client.db.collection('alliances').findOne({name:profile.alliance})

            //check if alliance exist
            if(alliance == null) return reject('Alliance doesnt exist.')
            
            //check if investment is integer
            if(!Number.isInteger(page) || page < 0) return reject('Page invalid.')
            
            //check if alliance has members
            if(alliance.members.length == 0) return reject('Your alliance has no members.')

            //setup empty array
            let output = []

            //get the members requested
            for(let j = client.settings.game.alliance.membersPerPage * page - client.settings.game.alliance.membersPerPage; j <= client.settings.game.alliance.membersPerPage * page - 1; j++){
                if(alliance.members[j]) {
                    let u = await client.users.fetch(alliance.members[j])
                    await output.push(`${u.username}#${u.discriminator}`)
                }
            }

            //check if output is empty
            if(output.length == 0) return reject('There are no members on that page.')

            //resolve the array
            await resolve(output)
        })
    }

    /**
     * Sets alliance home system
     * @param {String} user
     * @param {Integer} xPos
     * @param {Integer} yPos
     * @returns {Promise}
     */
    client.game.setAllianceHome = (user, xPos, yPos) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //if they arent in an alliance reject
            if(profile.alliance == null) return reject('User not in an alliance.')

            //load alliance profile
            let alliance = await client.db.collection('alliances').findOne({name:profile.alliance})

            //check if alliance exist
            if(alliance == null) return reject('Alliance doesnt exist.')

            //if they do not own the alliance reject
            if(alliance.owner != user) return reject('User is not owner of alliance.')

            //check if x and y are integers
            if(!Number.isInteger(xPos) || !Number.isInteger(yPos)) return reject('Must be a valid location.')

            //check x coord
            if(xPos < client.settings.game.map.minX || xPos > client.settings.game.map.maxX) return reject('Invalid X Coordinate.')

            //check y coord
            if(yPos < client.settings.game.map.minY || yPos > client.settings.game.map.maxY) return reject('Invalid Y Coordinate.')

            //set values
            alliance.homeSystemX = xPos
            alliance.homeSystemY = yPos

            //save data and resolve
            client.db.collection('alliances').update({name:alliance.name}, alliance)
            .then(() => resolve())
        })
    }

    /**
     * Warps user to location
     * @param {String} user
     * @param {Integer} xPos
     * @param {Integer} yPos
     * @returns {Promise}
     */
    client.game.warpUser = (user, xPos, yPos) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //check if x and y are integers
            if(!Number.isInteger(xPos) || !Number.isInteger(yPos)) return reject('Must be a valid location.')

            //check x coord
            if(xPos < client.settings.game.map.minX || xPos > client.settings.game.map.maxX) return reject(`Invalid X Coordinate. Map X goes from ${client.settings.game.map.minX} -> ${client.settings.game.map.maxX}`)

            //check y coord
            if(yPos < client.settings.game.map.minY || yPos > client.settings.game.map.maxY) return reject(`Invalid Y Coordinate. Map X goes from ${client.settings.game.map.minY} -> ${client.settings.game.map.maxY}`)

            //check if system exist
            let spawnSystem = await client.db.collection('map').findOne({xPos:xPos, yPos:yPos})
            if(spawnSystem == null) {
                //create system if it doesnt
                await client.game.createSystem(xPos, yPos)
            }

            //calculate distance
            let distance = Math.floor(Math.sqrt(Math.pow(profile.xPos - xPos, 2) + Math.pow(profile.yPos - yPos, 2)))

            //calculate travel time
            let travelTime = distance * client.settings.game.warpMultiplier / profile.ship.warpSpeed

            //check if user has enough fuel
            if(profile.ship.fuel - distance < 0) return reject(`User does not have enough fuel. This warp requires ${distance} fuel.`)

            //add them to warp cooldown
            await client.game.cooldowns.warp.push(user)

            await setTimeout(() => {
                //move user
                client.db.collection('users').update({id:user}, {$set:{xPos:xPos, yPos:yPos}})

                //remove fuel
                profile.ship.fuel -= distance
                client.db.collection('users').update({id:user}, {$set:{"ship.fuel": profile.ship.fuel}})

                //remove user from cooldown
                client.game.cooldowns.warp.splice(client.game.cooldowns.warp.indexOf(user), 1)
            }, travelTime * 1000)

            await resolve()
        })
    }

    /**
     * Get information about warp time and distance
     * @param {String} user
     * @param {Integer} xPos
     * @param {Integer} yPos
     * @returns {Promise} object
     */
    client.game.getWarpInfo = (user, xPos, yPos) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //calculate distance
            let distance = Math.floor(Math.sqrt(Math.pow(profile.xPos - xPos, 2) + Math.pow(profile.yPos - yPos, 2)))

            //calculate travel time
            let travelTime = distance * client.settings.game.warpMultiplier / profile.ship.warpSpeed

            await resolve({
                distance: distance,
                travelTime: travelTime
            })
        })
    }

    /**
     * Reward credits to user
     * @param {String} user
     * @param {Integer} amount
     * @returns {Promise}
     */
    client.game.reward = (user, amount) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //error if user doesnt exist
            if(profile == null) return reject('User does not exist.')

            //Make sure amount is integer
            if(!Number.isInteger(amount)) return reject('Amount is not integer.')

            //add amount to their credits
            profile.credits += amount

            //save data
            client.db.collection('users').update({id:user}, {$set:{credits:profile.credits}})

            //resolve
            resolve()
        })
    }

    /**
     * Purchase a ship for a user
     * @param {String} user
     * @param {String} ship
     * @returns {Promise}
     */
    client.game.buyShip = (user, ship) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //check if user is trying to buy their own ship
            if(profile.ship.type == ship) return reject('User own this ship already.')

            //setup empty ship variable
            let boughtShip

            //find ship
            await client.ships.forEach(e => {
                if(e.type == ship) boughtShip = e
            })

            //error if no ship
            if(!boughtShip) return reject('Ship does not exist.')

            //if they cant afford the ship
            if(profile.credits - boughtShip.cost < 0) return reject(`User cannot afford ship. This ship cost ${boughtShip.credits} credits.`)

            //charge user and replace ship
            profile.credits -= boughtShip.cost
            profile.ship = boughtShip

            //save data
            client.db.collection('users').update({id:user}, profile)

            //resolve
            resolve()
        })
    }

    /**
     * Get array of alliance members (restricted by settings)
     * @param {Integer} page
     * @returns {Promise} Array
     */
    client.game.getShipList = (page) => {
        return new Promise(async (resolve, reject) => {

            //check if page is integer
            if(!Number.isInteger(page) || page < 0) return reject('Page invalid.')
            
            //setup empty array
            let output = []

            //get the members requested
            for(let j = client.settings.game.shopListPerPage * page - client.settings.game.shopListPerPage; j <= client.settings.game.shopListPerPage * page - 1; j++){
                if(client.ships[j]) {
                    output.push(`${client.ships[j].type}`)
                }
            }

            //check if output is empty
            if(output.length == 0) return reject('There are no ships on that page.')

            //resolve the array
            await resolve(output)
        })
    }

    /**
     * Get ship object from shop
     * @param {String} type
     * @returns {Promise} Object
     */
    client.game.getShip = (type) => {
        return new Promise(async (resolve, reject) => {
            let object
            await client.ships.forEach(ship => {
                if(ship.type == type) object = ship
            })
            if(!object) return reject('No ship available with that type.')
            await resolve(object)
        })
    }

    /**
     * Calculates next colonies cost
     * @param {String} user
     * @returns {Promise} Integer
     */
    client.game.getNextColonyCost = (user) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //calculate cost
            let costA = profile.colonies.length * 3
            let costB = profile.colonies.length + 1
            let costC = Math.pow(profile.colonies.length, costA / costB)
            let costD = Math.floor(client.settings.game.colonies.colonyBaseCost * costC)

            //resolve the price
            resolve(costD)
        })
    }


    /**
     * Colonizes planet for user
     * @param {String} user
     * @param {String} targetPlanet
     * @returns {Promise}
     */
    client.game.colonizePlanet = (user, targetPlanet) => {
        return new Promise(async (resolve, reject) => {
              //load user profile
              let profile = await client.db.collection('users').findOne({id: user})

              //load system data
              let system = await client.db.collection('map').findOne({xPos: profile.xPos, yPos: profile.yPos})

              //find planet
              let a
              await system.planets.forEach(planet => {
                  if(planet.name == targetPlanet) a = planet
              })
              if(!a) return reject('Planet does not exist in system.')

              //calculate cost of colonization
              let cost = await client.game.getNextColonyCost(user)

              //check if user can afford
              if(profile.credits - cost < 0) return reject(`User cannot afford this colony. It would cost ${cost.toLocaleString()} credits.`)

              //change planet values
              await system.planets.forEach(planet => {
                  if(planet.name == targetPlanet) {
                      planet.owner = user
                      planet.population = client.settings.game.colonies.initialPopulation
                      planet.wallet = client.settings.game.colonies.initialWallet
                      planet.colonizedAt = client.moment().unix()
                      profile.colonies.push(planet)
                  }
              })

              //remove credits from user
              profile.credits -= cost

              //save
              await client.db.collection('map').update({xPos: system.xPos, yPos: system.yPos}, system)
              await client.db.collection('users').update({id:user}, profile)

              //resolve
              await resolve()
        })
    }

    /**
     * Get the current system object of user
     * @param {String} user
     * @returns {Promise} object
     */
    client.game.getCurrentSystem = (user) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //load system data
            let system = await client.db.collection('map').findOne({xPos: profile.xPos, yPos: profile.yPos})

            //resolve
            await resolve(system)
        })
    }

    /**
     * Mines the system and returns the astroids mined
     * @param {String} user
     * @returns {Promise} integer
     */
    client.game.mineSystem = (user) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //load system data
            let system = await client.db.collection('map').findOne({xPos: profile.xPos, yPos: profile.yPos})

            //check if there are astroids in system
            if(system.asteroids == 0) return reject('System empty of asteroids.')

            //astroids mined logic
            let asteroidsMined = Math.floor(profile.ship.miningSpeed * client.settings.game.astroidMiningMultiplier)

            //check if cargo is full
            if(profile.ship.oreStorage + asteroidsMined > profile.ship.oreStorageMax) return reject('Your ore storage is full.')

            //store asteroids to cargo
            profile.ship.oreStorage += asteroidsMined

            //remove asteroids from system
            if(system.asteroids - asteroidsMined < 0) system.asteroids = 0
            else system.asteroids -= asteroidsMined

            //save
            await client.db.collection('map').update({xPos: profile.xPos, yPos: profile.yPos}, system)
            await client.db.collection('users').update({id:user}, profile)

            //add them to mining cooldown
            await client.game.cooldowns.mining.push(user)

            //remove user from cooldown
            await setTimeout(() => {
                client.game.cooldowns.mining.splice(client.game.cooldowns.mining.indexOf(user), 1)
            }, client.settings.game.miningCooldown * 1000)

            //resolve
            await resolve(asteroidsMined)
        })
    }

    /**
     * Reprocess ores into fuel for the ship
     * @param {String} user
     * @param {Integer} amount should be fuel blocks wanted to be created
     * @returns {Promise}
     */
    client.game.processOres = (user, amount) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //check if amount is integer
            if(!Number.isInteger(amount) || amount < 0) return reject('Amount invalid.')

            //set fuel request to be made
            let oreUsed = await Math.floor(amount * client.settings.game.oreFuelConversion)

            //check if they have enough ore for a fuel block
            if(profile.ship.oreStorage - oreUsed < 0) return reject(`You do not have enough ore for that. Currently you can only make ${Math.floor(profile.ship.oreStorage/client.settings.game.oreFuelConversion)} fuel blocks.`)

            //check if they are over filling fuel tank
            if(profile.ship.fuel + amount > profile.ship.maxFuel) return reject('You cannot over-fill your fuel tank.')

            //remove ore from hold
            profile.ship.oreStorage -= oreUsed

            //add fuel to bay
            profile.ship.fuel += amount

            //save
            await client.db.collection('users').update({id:user}, profile)

            //add them to processing cooldown
            await client.game.cooldowns.processing.push(user)

            //remove user from cooldown
            await setTimeout(() => {
                client.game.cooldowns.processing.splice(client.game.cooldowns.processing.indexOf(user), 1)
            }, client.settings.game.processingTimePerBlock * amount * 1000)
            
            //resolve
            await resolve()
        })
    }

    /**
     * Deposits ores from hold into colony
     * @param {String} user
     * @param {String} colony
     * @param {Integer} amount or "all"
     * @returns {Promise}
     */
    client.game.depositOres = (user, colony, amount) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //load system data
            let system = await client.db.collection('map').findOne({xPos: profile.xPos, yPos: profile.yPos})

            //check if page is integer
            if(!Number.isInteger(amount) || amount < 0) return reject('Amount invalid.')

            //check if user has enough ores
            if(profile.ship.oreStorage - amount < 0) return reject('You do not have enough ore to perform this action.')

            //check if colony is in system
            let a
            await system.planets.forEach(planet => {
                if(planet.name == colony) a = planet
            })
            if(!a) return reject('Colony not found in system.')

            //check if user owns colony
            if(a.owner != user) return reject('User does not own this colony.')

            //add ores ro system colony
            await system.planets.forEach(planet => {
                if(planet.name == colony) {
                    planet.oreStorage += amount
                }
            })

            //add ores to user colony
            await profile.colonies.forEach(col => {
                if(col.name == colony) {
                    col.oreStorage += amount
                }
            })

            //remove ore from ore storage on ship
            profile.ship.oreStorage -= amount

            //save
            await client.db.collection('map').update({xPos: profile.xPos, yPos: profile.yPos}, system)
            await client.db.collection('users').update({id:user}, profile)

            //resolve
            await resolve()
        })

    }

    /**
     * Give a user credits
     * @param {String} user
     * @param {String} target
     * @param {Integer} amount
     * @returns {Promise}
     */
    client.game.giveCredits = (user, target, amount) => {
         return new Promise(async (resolve, reject) => {
             //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //check if give self credits
            if(user == target) return reject('You cant give yourself credits.')

            //load target profile
            let profile2 = await client.db.collection('users').findOne({id: target})

            //check if target is in db
            if(!profile2) return reject('Target not in database')

            //check if amount is integer
            if(!Number.isInteger(amount) || amount < 0) return reject('Amount invalid.')

            //check if user can afford
            if(profile.credits - amount < 0) return reject('User cannot afford this.')

            //set data
            profile.credits -= amount
            profile2.credits += amount

            //save
            await client.db.collection('users').updateOne({id:user}, {$set:{credits:profile.credits}})
            await client.db.collection('users').updateOne({id:target}, {$set:{credits:profile2.credits}})

            //resolve
            await resolve()
         })
    }

    /**
     * Returns user to closest colony, if not 20 systems away
     * @param {String} user
     * @returns {Promise}
     */
    client.game.returnUser = (user) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //create closest colony objcet
            let closestColony = {
                distance : Number.MAX_SAFE_INTEGER,
                xPos : 0,
                yPos : 0
            }

            //find closest colony logic
            await profile.colonies.forEach(colony => {
                let distance = Math.floor(Math.sqrt(Math.pow(profile.xPos - colony.xPos, 2) + Math.pow(profile.yPos - colony.yPos, 2)))
                if(distance < closestColony.distance) {
                    closestColony.distance = distance
                    closestColony.xPos = colony.xPos
                    closestColony.yPos = colony.yPos
                }
            })
            
            //if no colony found
            if(closestColony.distance == Number.MAX_SAFE_INTEGER) {

                //check if 20 units to left is available, if not move right 20
                if(profile.xPos - 20 < client.settings.game.map.minX) {
                    closestColony.xPos = profile.xPos + 20  
                } else {
                    closestColony.xPos = profile.xPos - 20
                }

                //check if bottom space is avail, if not move up 20
                if(profile.yPos - 20 < client.settings.game.map.minY) {
                    closestColony.yPos = profile.yPos + 20  
                } else {
                    closestColony.yPos = profile.yPos - 20
                }
            }

            //load destination
            let destination = await client.db.collection('map').findOne({xPos:closestColony.xPos, yPos:closestColony.yPos})

            //if system doesnt exist generate
            if(destination == null) {
                await client.game.createSystem(closestColony.xPos, closestColony.yPos)
            }

            //get warp info
            client.game.getWarpInfo(user, closestColony.xPos, closestColony.yPos)
            .then(async a => {

                //add them to warp cooldown
                await client.game.cooldowns.warp.push(user)

                await setTimeout(async () => {

                    //move user
                    await client.db.collection('users').update({id:user}, {$set:{xPos:closestColony.xPos, yPos:closestColony.yPos}})

                    //set user fuel to max
                    await client.db.collection('users').update({id:user}, {$set:{"ship.fuel":profile.ship.maxFuel}})

                    //remove user from cooldown
                    await client.game.cooldowns.warp.splice(client.game.cooldowns.warp.indexOf(user), 1)
                }, a.travelTime * 1000)

                //resolves
                await resolve(a)
            })
            .catch(e => reject(e))
        })
    }

    /**
     * Regenerates asteroids in all systems
     * @returns {Promise}
     */
    client.game.regenerateAsteroids = () => {
        return new Promise(async (resolve, reject) => {
            //get whole galaxy
            let galaxy = await client.db.collection('map').find({}).toArray()

            //loop through each system regenerating the asteroids
            await galaxy.forEach(system => {
                system.asteroids = Math.floor(Math.random() * client.settings.game.system.maxAsteroids + 1)
                client.db.collection('map').update({xPos: system.xPos, yPos: system.yPos}, {$set:{asteroids:system.asteroids}})
            })

            //resolve
            await resolve()
        })
    }

    /**
     * Get array of users colonies
     * @param {String} user
     * @param {Integer} page
     * @returns {Promise} object
     */
    client.game.getUserColonies = (user, page) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //check if investment is integer
            if(!Number.isInteger(page) || page < 0) return reject('Page invalid.')

            //setup empty array
            let output = []

            //get the members requested
            for(let j = client.settings.game.colonies.coloniesPerPage * page - client.settings.game.colonies.coloniesPerPage; j <= client.settings.game.colonies.coloniesPerPage * page - 1; j++){
                if(profile.colonies[j]) {
                    output.push(profile.colonies[j])
                }
            }

            //check if output is empty
            if(output.length == 0) return reject('There are no colonies on that page.')

            //resolve the array
            await resolve(output)
        })
    }

    /**
     * Get alliance leaderboards
     * @param {Integer} page
     * @param {String} type member, credits
     * @returns {Promise} array
     */
    client.game.getAllianceLeaderboard = (page, type) => {
        return new Promise(async (resolve, reject) => {
            //check if correct type
            if(type != 'members' && type != 'credits') return reject('Invalid leaderboard type.')

            //check if investment is integer
            if(!Number.isInteger(page) || page < 0) return reject('Page invalid.')

            //get all alliances
            let alliances = await client.db.collection('alliances').find({}).toArray()

            //create empty output array
            let output = []

            //sort the array by wallet
            if(type == 'credits') {
                await alliances.sort((a, b) => {
                    a = a.credits
                    b = b.credits
                    return b - a
                })

                //setup output array with data
                for(let j = client.settings.game.alliance.alliancesPerPage * page - client.settings.game.alliance.alliancesPerPage; j <= client.settings.game.alliance.alliancesPerPage * page - 1; j++){
                    if(alliances[j]) output.push(`${j}.) ${alliances[j].name} - ${alliances[j].credits}`)
                }
            }

            //sort array by member count
            if(type == 'members') {
                await alliances.sort((a, b) => {
                    a = a.members.length
                    b = b.members.length
                    return b -a
                })

                //setup output array with data
                for(let j = client.settings.game.alliance.alliancesPerPage * page - client.settings.game.alliance.alliancesPerPage; j <= client.settings.game.alliance.alliancesPerPage * page - 1; j++){
                    if(alliances[j]) output.push(`${j}.) ${alliances[j].name} - ${alliances[j].members.length}`)
                }
            }

            //check if output is empty
            if(output.length == 0) return reject('There are no alliances on that page.')

            //resolve out
            await resolve(output)
        })
    }

    /**
     * Get user leaderboards
     * @param {Integer} page
     * @param {String} type colonies, credits
     * @returns {Promise} array
     */
    client.game.getUserLeaderboard = (page, type) => {
        return new Promise(async (resolve, reject) => {
            //check if correct type
            if(type != 'colonies' && type != 'credits' && type != 'bounty') return reject('Invalid leaderboard type.')

            //check if investment is integer
            if(!Number.isInteger(page) || page < 0) return reject('Page invalid.')

            //get all alliances
            let users = await client.db.collection('users').find({}).toArray()

            //create empty output array
            let output = []

            //sort the array by wallet
            if(type == 'credits') {
                await users.sort((a, b) => {
                    a = a.credits
                    b = b.credits
                    return b - a
                })

                //setup output array with data
                for(let j = client.settings.game.usersPerPage * page - client.settings.game.usersPerPage; j <= client.settings.game.usersPerPage * page - 1; j++){
                    if(users[j]){
                        await client.users.fetch(users[j].id)
                        .then(u => {
                            output.push(`${j}.) ${u.username}#${u.discriminator} - ${users[j].credits}`)
                        })
                    }
                }
            }

            //sort array by member count
            if(type == 'colonies') {
                await users.sort((a, b) => {
                    a = a.colonies.length
                    b = b.colonies.length
                    return b - a
                })

                //setup output array with data
                for(let j = client.settings.game.usersPerPage * page - client.settings.game.usersPerPage; j <= client.settings.game.usersPerPage * page - 1; j++){
                    if(users[j]){
                        await client.users.fetch(users[j].id)
                        .then(u => {
                            output.push(`${j}.) ${u.username}#${u.discriminator} - ${users[j].colonies.length}`)
                        })
                    }
                }
            }

            //sort array by bounty
            if(type == 'bounty') {
                await users.sort((a, b) => {
                    a = a.bounty
                    b = b.bounty
                    return b - a
                })

                //setup output array with data
                for(let j = client.settings.game.usersPerPage * page - client.settings.game.usersPerPage; j <= client.settings.game.usersPerPage * page - 1; j++){
                    if(users[j]){
                        await client.users.fetch(users[j].id)
                        .then(u => {
                            output.push(`${j}.) ${u.username}#${u.discriminator} - ${users[j].bounty}`)
                        })
                    }
                }
            }

            //check if output is empty
            if(output.length == 0) return reject('There are no users on that page.')

            //resolve out
            await resolve(output)
        })
    }
    
    /**
     * Upgrades a users ship
     * @param {String} user
     * @param {String} type mining warp scan fuel attack defense
     * @param {Integer} amount
     * @returns {Promise} On success or fail
     */
    client.game.upgradeShip = (user, type, amount) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //check if investment is integer
            if(!Number.isInteger(amount) || amount < 0) return reject('Amount invalid.')
            
            //get next upgrade cost
            let cost = await client.game.getNextUpgradeCost(user, type, amount)
            .catch(e => reject(e))

            //check if user can afford
            if(profile.credits - cost < 0) return reject(`You cannot afford this. Your next upgrade cost \`${cost}\` credits.`)

            //add upgrade to ship
            switch(type) {
                case 'mining':
                    if(profile.ship.miningSpeed + amount > profile.ship.maxMiningSpeed) return reject('You cannot over upgrade your ship.')
                    profile.credits -= cost
                    profile.ship.miningSpeed += amount
                    break
                case 'warp':
                    if(profile.ship.warpSpeed + amount > profile.ship.maxWarpSpeed) return reject('You cannot over upgrade your ship.')
                    profile.credits -= cost
                    profile.ship.warpSpeed += amount
                    break
                case 'scan':
                    if(profile.ship.scannerSpeed + amount > profile.ship.maxScannerSpeed) return reject('You cannot over upgrade your ship.')
                    profile.credits -= cost
                    profile.ship.scannerSpeed += amount
                    break
                case 'attack':
                    if(profile.ship.attack + amount > profile.ship.maxAttack) return reject('You cannot over upgrade your ship.')
                    profile.credits -= cost
                    profile.ship.attack += amount
                    break
                case 'defense':
                    if(profile.ship.defense + amount > profile.ship.maxDefense) return reject('You cannot over upgrade your ship.')
                    profile.credits -= cost
                    profile.ship.defense += amount
                    break
                default:
                    reject('Type invalid.')
            }

            //save data
            await client.db.collection('users').update({id:user}, profile)

            //resolve
            await resolve()
        })
    }

    /**
     * gets next upgrade cost
     * @param {String} user
     * @param {String} type mining warp scan fuel attack defense
     * @param {Integer} amount
     * @returns {Promise} Integer
     */
    client.game.getNextUpgradeCost = (user, type, amount) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //check if investment is integer
            if(!Number.isInteger(amount) || amount < 0) return reject('Amount invalid.')
            
            //check type and get price
            switch(type) {
                case 'mining':
                    resolve(profile.ship.miningSpeed * amount * client.settings.game.upgrade.mining)
                    break
                case 'warp':
                    resolve(profile.ship.warpSpeed * amount * client.settings.game.upgrade.warp)
                    break
                case 'scan':
                    resolve(profile.ship.scannerSpeed * amount * client.settings.game.upgrade.scanner)
                    break
                case 'attack':
                    resolve(profile.ship.attack * amount * client.settings.game.upgrade.attack)
                    break
                case 'defense':
                    resolve(profile.ship.defense * amount * client.settings.game.upgrade.defense)
                    break
                default:
                    return reject('Type invalid.')
            }
        })
    }

    /**
     * Generates colony passive profits and removes ores from colony (rework to loop over user instead of galaxy)
     * @returns {Promise}
     */
    client.game.generateColonyMoney = () => {
        return new Promise(async (resolve, reject) => {
            
            //loa users
            client.db.collection('users').find({}).toArray()
            .then(async userBase => {
                //for each user in base
                await userBase.forEach(async user => {
                    if(!user.colonies) user.colonies=[]
                    //for each colony
                    await user.colonies.forEach(async colony => {
                        //calculate ores used
                        let p1 = colony.population + 100
                        let convertedOre = Math.floor(p1 / 30)

                        //check if ore storage is empty or will be after next process
                        if(colony.oreStorage - convertedOre < 0) {
                            //if ore storage will be empty use rest of ore
                            convertedOre = colony.oreStorage
                        }

                        //calculate profit from planet
                        let profit = convertedOre * client.settings.game.oreConversion

                        //set values
                        user.credits += profit
                        colony.oreStorage -= convertedOre
                        
                        //load map
                        await client.db.collection('map').findOne({xPos: colony.xPos, yPos: colony.yPos})
                        .then(async system => {
                            //find and change planet
                            await system.planets.forEach(planet => {
                                if(planet.name == colony.name){
                                    planet.oreStorage -= convertedOre
                                }
                            })
                            //save map
                            await client.db.collection('map').update({xPos: colony.xPos, yPos: colony.yPos}, system)
                        })

                    })

                    //save
                    await client.db.collection('users').update({id: user.id}, user)
                })

                //resolve
                await resolve()
            })
        })
    }

    /**
     * Generates population for every colony (rework to loop over user instead of galaxy)
     * @returns {Promise}
     */
    client.game.generateColonyPopulation = () => {
        return new Promise(async (resolve, reject) => {
            
            //loa users
            let userBase = await client.db.collection('users').find({}).toArray()

            //for each user in base
            await userBase.forEach(async user => { 
                if(!user.colonies) user.colonies=[]
                //for each colony
                await user.colonies.forEach(async colony => {
                    
                    //calculate population grown
                    let populationGrowth = Math.floor(colony.wallet / 4 / 4 / 3 * .5)

                    //set planet population
                    if(colony.population + populationGrowth > client.settings.game.planet.maxPopulation){
                        colony.population = client.settings.game.planet.maxPopulation
                    } else {
                        colony.population += populationGrowth
                    }
                    
                    //load map
                    await client.db.collection('map').findOne({xPos: colony.xPos, yPos: colony.yPos})
                    .then(async system => {
                        //find and change planet
                        await system.planets.forEach(planet => {
                            if(planet.name == colony.name){
                                planet.population = colony.population
                            }
                        })
                        //save map
                        await client.db.collection('map').update({xPos: colony.xPos, yPos: colony.yPos}, system)
                    })

                })

                //save
                await client.db.collection('users').update({id: user.id}, user)
            })

            //resolve
            await resolve()
        })
    }

    /**
     * Fetch alliance join request
     * @param {String} user
     * @param {Integer} page
     * @return {Promise}
     */
    client.game.getAllianceApplications = (user, page) => {
        return new Promise(async (resolve, reject) => {
            //check if investment is integer
            if(!Number.isInteger(page) || page < 0) return reject('Page invalid.')

            //get all alliances
            let profile = await client.db.collection('users').findOne({id:user})

            //check if user is in alliance
            if(profile.alliance == null) return reject('User is not in an alliance.')

            //load alliance profile
            let alliance = await client.db.collection('alliances').findOne({name:profile.alliance})

            //check if alliance exist
            if(alliance == null) return reject('Alliance doesnt exist.')

            //check if user is alliance owner
            if(alliance.owner != user) return reject('User does not own the alliance.')

            //create empty output array
            let output = []

            //get the members requested
            for(let j = client.settings.game.alliance.membersPerPage * page - client.settings.game.alliance.membersPerPage; j <= client.settings.game.alliance.membersPerPage * page - 1; j++){
                if(alliance.joinRequest[j]) {
                    let u = await client.users.fetch(alliance.joinRequest[j])
                    output.push(`${j}.) ${u.username}#${u.discriminator}`)
                }
            }

            //check if users on page
            if(output.length == 0) return reject('No users on that page.')

            //resolve
            await resolve(output)
        })
    }

    /**
     * Accept a user into the appliance
     * @param {String} user
     * @param {Integer} index
     * @returns {Promise}
     */
    client.game.acceptAllianceApplications = (user, index) => {
        return new Promise(async (resolve, reject) => {
            //check if index is integer
            if(!Number.isInteger(index) || index < 0) return reject('Page invalid.')

            //get all alliances
            let profile = await client.db.collection('users').findOne({id:user})

            //check if user is in alliance
            if(profile.alliance == null) return reject('Executor is not in an alliance.')

            //load alliance profile
            let alliance = await client.db.collection('alliances').findOne({name:profile.alliance})

            //check if alliance exist
            if(alliance == null) return reject('Alliance doesnt exist.')

            //check if user is alliance owner
            if(alliance.owner != user) return reject('User does not own the alliance.')
            
            //check if user is in position
            if(!alliance.joinRequest[index]) return reject('No user in that position.')

            //get the target
            let target = await client.users.fetch(alliance.joinRequest[index])

            //fetch target profile and add to alliance
            let targetProfile = await client.db.collection('users').findOne({id:target.id})

            //check if target is in alliance
            if(targetProfile.alliance != null) {
                await delete alliance.joinRequest[index]
                await client.db.collection('alliances').update({name:alliance.name}, alliance)
                await reject('User is in an alliance')
                return
            }

            //let user know they were accepted
            target.send(`You have been accepted into \`${alliance.name}\`.`)

            //add them into alliance
            targetProfile.alliance = alliance.name
            
            //push them into members
            await alliance.members.push(alliance.joinRequest[index])

            //take user out of alliance
            await delete alliance.joinRequest[index]

            //save alliance
            await client.db.collection('alliances').update({name:alliance.name}, alliance)

            //save target
            await client.db.collection('users').update({id:target.id}, targetProfile)

            //resolve
            await resolve()
        })
    }

    /**
     * Deny user from alliance
     * @param {String} user
     * @param {Integer} index
     * @returns {Promise}
     */
    client.game.denyAllianceApplications = (user, index) => {
        return new Promise(async (resolve, reject) => {
            //check if index is integer
            if(!Number.isInteger(index) || index < 0) return reject('Page invalid.')

            //get all alliances
            let profile = await client.db.collection('users').findOne({id:user})

            //check if user is in alliance
            if(profile.alliance == null) return reject('User is not in an alliance.')

            //load alliance profile
            let alliance = await client.db.collection('alliances').findOne({name:profile.alliance})

            //check if alliance exist
            if(alliance == null) return reject('Alliance doesnt exist.')

            //check if user is alliance owner
            if(alliance.owner != user) return reject('User does not own the alliance.')
            
            //check if user is in position
            if(!alliance.joinRequest[index]) return reject('No user in that position.')

            //get the target
            let target = await client.users.fetch(alliance.joinRequest[index])

            //let user know they were accepted
            target.send(`You have been denied from \`${alliance.name}\`.`)

            //take user out of alliance
            await delete alliance.joinRequest[index]

            //save alliance
            await client.db.collection('alliances').update({name:alliance.name}, alliance)

            //resolve
            await resolve()
        })
    }

    /**
     * Apply for an alliance
     * @param {String} user
     * @param {String} allianceName
     * @returns {Promise}
     */
    client.game.applyToAlliance = (user, allianceName) => {
        return new Promise(async (resolve, reject) => {

            //get user
            let profile = await client.db.collection('users').findOne({id:user})

            //check if user is in alliance
            if(profile.alliance != null) return reject('User is in an alliance. To join a new one, they must leave.')

            //get alliance profile
            let alliance = await client.db.collection('alliances').findOne({name:allianceName})

            //check if alliance exist
            if(alliance == null) return reject('That alliance does not exist.')
            
            //if alliance exist push user to members
            await alliance.joinRequest.push(user)

            //save alliance
            await client.db.collection('alliances').update({name:alliance.name}, alliance)

            //resolve
            await resolve()
        })
    }

    /**
     * Get a users specific colony
     * @param {String} user
     * @param {String} name
     * @returns {Promise}
     */
    client.game.getColony = (user, colonyName) => {
        return new Promise(async (resolve, reject) => {
            //get user
            let profile = await client.db.collection('users').findOne({id:user})

            //set empty output
            let output

            //find colony
            await profile.colonies.forEach(colony => {
                if(colony.name == colonyName) output = colony
            })

            //if colony doesnt exist
            if(!output) return reject('Colony not found')

            //resolve
            await resolve(output)
        })
    }

    client.game.sellOre = (user, amount) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //load system data
            let system = await client.db.collection('map').findOne({xPos: profile.xPos, yPos: profile.yPos})

            //if amount is all use all storage
            if(amount = 'all') amount = profile.ship.oreStorage

            //check if page is integer
            if(!Number.isInteger(amount) || amount < 0) return reject('Amount invalid.')

            //check if user has enough ores
            if(profile.ship.oreStorage - amount < 0) return reject('You do not have enough ore to perform this action.')

            let profit = Math.floor(amount * client.settings.game.quickOreConversion)

            //remove ore from ore storage on ship
            profile.ship.oreStorage -= amount
            profile.credits += profit

            //save
            await client.db.collection('users').update({id:user}, profile)

            //resolve
            await resolve(profit)
        })
    }

    /**
     * Buy mining bot for colony
     * @param {String} user
     * @param {String} colony
     * @param {Integer} amount
     * @returns {Promise}
     */
    client.game.buyMiningBot = (user, colony, amount) => {
         return new Promise(async (resolve, reject) => {
             //load user profile
            let profile = await client.db.collection('users').findOne({id: user})

            //load system data
            let system = await client.db.collection('map').findOne({xPos: profile.xPos, yPos: profile.yPos})

            //check if page is integer
            if(!Number.isInteger(amount) || amount < 0) return reject('Amount invalid.')

            //check if colony is in system
            let a
            await system.planets.forEach(planet => {
                if(planet.name == colony) a = planet
            })
            if(!a) return reject('Colony not found in system.')

            //check if they own colony
            if(a.owner != user) return reject('You dont own this colony.')

            //figure out cost
            let cost = Math.floor(amount * client.settings.game.miningBotCost)

            //check if they can afford
            if(profile.credits - cost < 0) return reject(`You cannot afford this. This would cost \`${cost}\` credits.`)

            //update system colony
            await system.planets.forEach(planet => {
                if(planet.name == colony) {
                    planet.miningBots += amount
                }
            })

            //update user colony
            await profile.colonies.forEach(planet => {
                if(planet.name == colony) {
                    planet.miningBots += amount
                }
            })

            //remove credits
            profile.credits -= cost

            //save
            await client.db.collection('users').update({id:user}, profile)
            await client.db.collection('map').update({xPos: system.xPos, yPos: system.yPos}, system)
            
            //resolve
            await resolve()
         })
    }

    /**
     * Generates colony passive profits and removes ores from colony and system (rework to loop over user instead of galaxy)
     * @returns {Promise}
     */
    client.game.generateBotOre = () => {
        return new Promise(async (resolve, reject) => {
            
            //load galaxy
            let galaxy = await client.db.collection('map').find({}).toArray()

            //for each star system
            await galaxy.forEach(async system => {
                
                //for every planet in the star system
                await system.planets.forEach(async planet => {
                    
                    //check if planet is ownd
                    if(planet.owner != null) {

                        let generateOre = Math.floor(parseInt(planet.miningBots * client.settings.game.miningBotProduction))

                        //check if system can handle it if they cant remove rest of ore
                        if(system.asteroids - generateOre < 0) {
                            generateOre = system.asteroids
                            system.asteroids = 0
                        } else {
                            system.asteroids -= generateOre
                        }

                        planet.oreStorage += generateOre

                        //load owner of planet
                        await client.db.collection('users').findOne({id:planet.owner})
                        .then(async profile => {

                            //find the colony
                            await profile.colonies.forEach(colony => {
                                if(colony.name == planet.name) {

                                    //add ore to colony planet
                                    colony.oreStorage += generateOre
                                }
                            })
                            
                            //save user data
                            await client.db.collection('users').update({id:planet.owner}, profile)
                        })
                    }   
                })

                //save system
                await client.db.collection('map').update({xPos: system.xPos, yPos: system.yPos}, system)
            })
            
            //resolve
            await resolve()
        })
    }

    /**
     * Add bounty on target
     * @param {String} user
     * @param {String} target
     * @param {Integer} amount
     */
    client.game.addBounty = (user, target, amount) => {
        return new Promise(async (resolve, reject) => {
            //load user profile
           let profile = await client.db.collection('users').findOne({id: user})

           //check if target is self
           if(target == user) return reject('You cannot set a bounty on yourself.')

           //load target profile
           let targetProfile = await client.db.collection('users').findOne({id: target})

           //check if exist in db
           if(targetProfile == null) return reject('Target not found in database.')

           //check if page is integer
           if(!Number.isInteger(amount) || amount < 0) return reject('Amount invalid.')

           //check if user can afford bounty set
           if(profile.credits - amount < 0) return reject('User cannot afford this.')

           //remove credits from user
           profile.credits -= amount

           //set bounty
           targetProfile.bounty += amount

           //save data
           client.db.collection('users').update({id: profile.id}, {$set:{credits:profile.credits}})
           client.db.collection('users').update({id: targetProfile.id}, {$set:{bounty:targetProfile.bounty}})

           //resolve
           resolve()
        })
    }

}