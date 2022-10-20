const { Connection } = require('../mongo/mongo');
const { userCommunities } = require('../userCommunities');
const DBarticles = new Connection('articles');

async function getSubscribeInfoForEachArticles(articlesArr, authorization) {
  let articlesWithSubscribe = [];
  await DBarticles.connectToMongo();
  for (let index = 0; index < articlesArr.length; index++) {
    const element = articlesArr[index];
    let alreadySubscribe = false;

    let subscribeInfo = false;
    if (authorization && authorization !== 'false') {
      subscribeInfo = await DBarticles.db
        .collection('subscribes')
        .findOne({ type: 'user', id: element.user });
    }

    if (subscribeInfo) {
    alreadySubscribe = true;
    }
    const newElement = { ...element, subscribe: alreadySubscribe };
    articlesWithSubscribe.push(newElement);
  }

  return articlesWithSubscribe;
}

module.exports.getSubscribeInfoForEachArticles =
  getSubscribeInfoForEachArticles;
