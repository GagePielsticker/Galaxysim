module.exports = client => {

    let MongoClient = require('mongodb').MongoClient

    /**
     * Connects mongoDB Database and appends it on client.db
     */
    client.connectDb = () => {
        return new Promise((resolve, reject) => {
            MongoClient.connect(client.settings.mongodbURL, {useNewUrlParser: true}, async (err, data) => {
                client.db = await data.db('gsim')
                if(err) return reject(`Error connecting to db: ${err}`)
                else await resolve()
            })
        })
    }
}