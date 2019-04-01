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


}