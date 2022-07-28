const { MongoClient } = require('mongodb');

class Connection {

  constructor(dbName) {
    this.dbName = dbName;
    this.url = 'mongodb://localhost:27017';
    this.options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    this.db = null
  }

   async connectToMongo() {

    if (this.db) return this.db;
    console.log(" Connect to ",this.dbName)
    const client = await MongoClient.connect(this.url, this.options);
    this.db = client.db(this.dbName);

    return this.db;
  }
  
}
// Connection.dbName="articles"
// Connection.db = null;
// Connection.url = 'mongodb://localhost:27017';
// Connection.options = {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// };

module.exports = { Connection };
