const {MongoClient} = require ('mongodb')

class Connection {

    static async connectToMongo() {
        if (this.db) return this.db
        const client = await MongoClient.connect(this.url, this.options)
        this.db = client.db(this.dbName)
        return this.db
    }
}
Connection.dbName="articles"
Connection.db = null
Connection.url = 'mongodb://localhost:27017'
Connection.options = {
    useNewUrlParser:    true,
    useUnifiedTopology: true
}

module.exports = { Connection }
