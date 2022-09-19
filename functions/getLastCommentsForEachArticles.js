const { Connection } = require('../mongo/mongo');
// const ObjectId = require('mongodb').ObjectId;
const DBarticles = new Connection('articles');

 async function getLastCommentsForEachArticles (articlesArr) {
  await DBarticles.connectToMongo();
  let articlesWithCommentsArr = []

  for (let index = 0; index < articlesArr.length; index++) {
    const element = articlesArr[index];
    const commentsDB = await DBarticles.db
    .collection('comments')
    .find({})
    .sort({ commentDate: -1 })
    .limit(2)
    .toArray()

    const newElement = {...element, comments: commentsDB}
    articlesWithCommentsArr.push(newElement)
  }
  return articlesWithCommentsArr
}

module.exports.getLastCommentsForEachArticles = getLastCommentsForEachArticles