const { Connection } = require('../mongo/mongo');

class UserController {
  async get(req, res) {
    try {
      console.log(' GET obtained');
      return res.send('Server work');
    } catch (err) {
      console.log(' get Error: ', err);
    }
  }

  async db(req, res) {
    try {
      await Connection.connectToMongo();
      const contentDB = await Connection.db.collection('users_data').find({}).toArray();
      return res.json(contentDB);
    } catch (err) {
      console.log('DB error', err);
    }
  }
 
  async brand(req, res) {
    try {
      await Connection.connectToMongo();
      const brand = req.params.id
      console.log(brand)
     
      const contentDB = await Connection.db.collection('users_data').find({brand:brand, type:{$in:["CarIcon","Article"]}}).sort({'publicationDate':-1}).toArray();
      return res.json(contentDB);
    } catch (err) {
      console.log('DB error', err);
    }
  }
}

module.exports = new UserController();
