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
    if (authorization) {
      subscribeInfo = await DBarticles.db
        .collection('subscribes')
        .findOne({ type: userCommunities, id: element.user });
    }
    console.log('subscribeInfo ', subscribeInfo)
    if (subscribeInfo) {
    alreadySubscribe = true;
    }
    const newElement = { ...element, subscribe: [alreadySubscribe] };
    articlesWithSubscribe.push(newElement);
  }

  return articlesWithSubscribe;
}

module.exports.getSubscribeInfoForEachArticles =
  getSubscribeInfoForEachArticles;
