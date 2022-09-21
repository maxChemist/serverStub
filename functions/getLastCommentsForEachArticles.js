const { Connection } = require('../mongo/mongo');
// const ObjectId = require('mongodb').ObjectId;
const DBarticles = new Connection('articles');
const { getUserInfoByName } = require('./getUserInfoByName');

async function getLastCommentsForEachArticles(articlesArr) {
  await DBarticles.connectToMongo();
  let articlesWithCommentsArr = [];

  for (let index = 0; index < articlesArr.length; index++) {
    const element = articlesArr[index];
    const commentsDB = await DBarticles.db
      .collection('comments')
      .find({})
      .sort({ commentDate: -1 })
      .limit(2)
      .toArray();

      let reformedArr = []
    for (let i = 0; i < commentsDB.length; i++) {
      const elem = commentsDB[i];
      const userData = await getUserInfoByName();
      const newElem = { ...elem, user: userData };
      reformedArr.push(newElem)
    }

    const newElement = { ...element, comments: reformedArr };
    articlesWithCommentsArr.push(newElement);
  }
  return articlesWithCommentsArr;
}

module.exports.getLastCommentsForEachArticles = getLastCommentsForEachArticles;
