module.exports = client => {

    //setup global variables
    let MongoClient = require('mongodb').MongoClient
    let db

    //connects to database and loads up cronjob library on connection
    client.connectDb = callback => {
        MongoClient.connect(client.settings.mongodb_url, {useNewUrlParser: true}, (err, data) => {
            db = data.db(client.settings.mongodb_db)
            if(err) return client.log(`Error connecting to db: ${err}`)
            require('./cron_jobs.js')(client)
            callback()
        })
    }

    //load user object from database, pass * to get ALL users data as an object
    client.load_user_data = (d_id, callback) => {
        if(d_id == '*'){
            db.collection('users').find({}, (err, res) => {
                callback(res)
            })
        } else {
            db.collection('users').findOne({id: d_id}, (err, res) => {
                callback(res)
            })
        }
    }

    //write user object to database and replace
    client.write_user_data = (d_id, obj) => {
        if(d_id == '*'){
            db.collection('users').update(
                ({}),
                obj,
                {upsert:true}
            )
        }
        else {
            db.collection('users').update(
                ({id: d_id}),
                obj,
                {upsert:true}
            )
        }
    }

    //load user object from database, pass * to get ALL users data as an object
    client.load_g_owner_array = (callback) => {
        db.collection('g_array').findOne({}, (err, res) => {
            callback(res)
        })
    }

    client.write_g_owner_array = (obj) => {
        db.collection('g_array').update(
            ({}),
            obj,
            {upsert:true}
        )
    }

        
    //load system object from database
    client.load_system_data = (x_pos, y_pos, callback) => {
        db.collection('map').findOne({x_pos: x_pos, y_pos: y_pos}, (err, res) => {
            callback(res)
        })
    }

    //load all systems
    client.load_all_systems = (callback) => {
        db.collection('map').find({}, (err, res) => {
            callback(res)
        })
    }

    //write system object to database and replace
    client.write_system_data = (x_pos, y_pos, obj) => {

        db.collection('map').update(
            ({x_pos: x_pos, y_pos: y_pos}),
            obj,
            {upsert:true}
        )
    }

    //load alliance object from database
    client.load_alliance_data = (name, callback) => {
        if(name == '*'){
            db.collection('alliances').find({}, (err, res) => {
                callback(res)
            })
        } else {
            db.collection('alliances').findOne({name: name}, (err, res) => {
                callback(res)
            })
        }
    }

    //write alliance object to database and replace
    client.write_alliance_data = (name, obj) => {
        db.collection('alliances').update(
            ({name: name}),
            obj,
            {upsert:true}
        )
    }

    client.delete_alliance_data = (name) => {
        db.collection('alliances').remove(
            ({name: name})
        )
    }

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
                    if(response == null) {
                        client.create_system(x_spawn, y_spawn)
                    }
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
        


}