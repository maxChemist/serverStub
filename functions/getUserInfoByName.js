const { Connection } = require('../mongo/mongo');
// const ObjectId = require('mongodb').ObjectId;
const DBarticles = new Connection('articles');

async function getUserInfoByName(userName) {
  // imitation get user info
  return {userName: 'userName',
          avatar: 'https://a.d-cd.net/eMAAAgA6QuA-100.jpg'}

}

module.exports.getUserInfoByName = getUserInfoByName;
