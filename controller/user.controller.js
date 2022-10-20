const { Connection } = require('../mongo/mongo');
const ObjectId = require('mongodb').ObjectId;
const {
  getLastCommentsForEachArticles,
} = require('../functions/getLastCommentsForEachArticles');
const {
  getSubscribeInfoForEachArticles,
} = require('../functions/getSubscribeInfoForEachArticles');
const { userData } = require('../userDataStub');
const { userCommunities } = require('../userCommunities');
const { recomendedCommunities } = require('../recomendedCommunities');
const { communityPage } = require('../communityPage');
const { communityForums } = require('../communityForums');

const fs = require('fs');
const req = require('express/lib/request');

const articlesCollection = 'articles_updated_30_09_2022';

let articleObject = {};
const DBarticles = new Connection('articles');
const DBstructure = new Connection('brands_structure');

const articlePerPage = 5;

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
      await DBarticles.connectToMongo();
      const contentDB = await DBarticles.db
        .collection('users_data')
        .find({})
        .toArray();
      return res.json(contentDB);
    } catch (err) {
      console.log('DB error', err);
    }
  }

  async brand(req, res) {
    try {
      // await Connection.connectToMongo();
      await DBarticles.connectToMongo();
      const brand = req.params.id;
      const page = req.params.page;
      const query = req.query;
      // console.log(brand, page , page, query , query)
      const requestedPage =
        query.page && Number(query.page) ? Number(query.page) : 1;
      console.log(
        'requestedPage ',
        requestedPage,
        ' query.page ',
        query.page,
        Number(query.page)
      );
      const contentDB = await DBarticles.db
        .collection('users_data')
        .find({ brand: brand, type: { $in: ['CarIcon', 'Article'] } })
        .sort({ publicationDate: -1 })
        .skip((requestedPage - 1) * articlePerPage)
        .limit(articlePerPage)
        .toArray();
      const totalRecDB = await DBarticles.db
        .collection('users_data')
        .countDocuments({
          brand: brand,
          type: { $in: ['CarIcon', 'Article'] },
        });

      const totalPage = Math.ceil(totalRecDB / articlePerPage);
      console.log(
        brand,
        'requestedPage ',
        requestedPage,
        ' total rec: ',
        totalRecDB,
        'articlePerPage ',
        articlePerPage,
        'totalPage ',
        totalPage
      );

      return res.json({
        currentPage: requestedPage,
        totalPage: totalPage,
        articles: contentDB,
      });
    } catch (err) {
      console.log('DB error', err);
    }
  }

  async structure(req, res) {
    try {
      // await Connection.connectToMongo();
      await DBstructure.connectToMongo();
      const brandCode = req.params.id;

      const structure = await DBstructure.db
        .collection('brandsStructure')
        .findOne({ code: brandCode });

      console.log(brandCode);
      return res.json({ structure });
    } catch (err) {
      console.log('DB request STRUCTURE error', err);
    }
  }

  async getRecomendedArticles(req, res) {
    try {
      console.log(' getRecomendedArticles req', req.query);
      const query = req.query;
      const { page } = query;
      const articlePerPage = 4;
      const requestedPage = query.page && Number(page) ? Number(page) : 1;

      await DBarticles.connectToMongo();
      const totalRecDB = await DBarticles.db
        .collection(articlesCollection)
        .countDocuments({});

      const totalPage = Math.ceil(totalRecDB / articlePerPage);

      const allRecomendedArticle = await DBarticles.db
        .collection(articlesCollection)
        .find({})
        .sort({ likes: -1 })
        .skip((requestedPage - 1) * articlePerPage)
        .limit(articlePerPage)
        .toArray();

      const responceArr = allRecomendedArticle.map((v) => ({
        id: v._id,
        likes: v.likes,
        title: v.title,
        user: v.user,
        code: v.code,
        brand: v.brand,
        model: v.model,
        modelID: v.modelID,
        generation: v.generation,
        generationID: v.generationID,
        publicationDate: v.publicationDate,
        image: v.body.filter((el) => el.image)[0]
          ? v.body.filter((el) => el.image)[0].image
          : '',
        year: v.year,
      }));

      return res.json({
        recomended: responceArr,
        currentPage: requestedPage,
        totalPage: totalPage,
      });
    } catch (err) {
      console.log('DB request STRUCTURE error', err);
    }
  }

  async oneArticle(req, res) {
    try {
      let userData = {};
      let currentCarsInfo = [];
      let exCarsInfo = [];
      let prevArticle = {};
      let nextArticle = {};

      const id = req.params.id;
      const o_id = new ObjectId(id);

      await DBarticles.connectToMongo();
      const contentDB = await DBarticles.db
        .collection(articlesCollection)
        .findOne({ _id: o_id });

      if (contentDB) {
        userData = await DBarticles.db
          .collection('users_information')
          .findOne({ user: contentDB.user });

        //---find cars model by g...
        await DBstructure.connectToMongo();
        if (userData && userData.currentCars) {
          const currCarsArr = [contentDB.generationID, ...userData.currentCars];
          let searchObj = currCarsArr.map((v) => ({ generationID: v }));

          let structure = await DBstructure.db
            .collection('detailedBrandsStructure')
            .find({ $or: searchObj })
            .toArray();

          currentCarsInfo = structure;

          searchObj = userData.exCar.map((v) => ({ generationID: v }));

          structure = await DBstructure.db
            .collection('detailedBrandsStructure')
            .find({ $or: searchObj })
            .toArray();

          exCarsInfo = structure;
        }

        //-- find prev article and next rticle---

        const allUsersArticle = await DBarticles.db
          .collection(articlesCollection)
          .find({ user: contentDB.user })
          .sort({ publicationDate: 1 })
          .toArray();

        let currArticleIndex;
        const arr = allUsersArticle.map((v, i) => {
          if (id == v._id) {
            currArticleIndex = i;
          }
          return {
            _id: v._id,
            publicationDate: v.publicationDate,
            title: v.title,
          };
        });

        const preIndex = currArticleIndex > 0 ? currArticleIndex - 1 : -1;
        const nextIndex =
          currArticleIndex < arr.length - 1 ? currArticleIndex + 1 : -1;

        if (preIndex >= 0) {
          prevArticle = { id: arr[preIndex]._id, title: arr[preIndex].title };
        } else {
          prevArticle = false;
        }

        if (nextIndex >= 0) {
          nextArticle = { id: arr[nextIndex]._id, title: arr[nextIndex].title };
        } else {
          nextArticle = false;
        }

        console.log('currArticleIndex ', currArticleIndex);
        console.log('preIndex ', preIndex);
        console.log('nextIndex ', nextIndex);
      }
      const article = Object.assign(
        { currentCarsInfo },
        { exCarsInfo },
        { prevArticle },
        { nextArticle },
        userData,
        contentDB
      );

      const articleWithSubscribe = await getSubscribeInfoForEachArticles(
        [article],
        req.headers.authorization
      );

      return res.json({
        article: articleWithSubscribe[0],
      });
    } catch (err) {
      console.log(' oneArticle ', err);
    }
  }

  // ****************************************************************
  async articles(req, res) {
    try {
      const brand = req.params.brand;
      const id = req.params.id;
      const query = req.query;
      const { about, engine, transmission, wheeldrive, page } = query;
      const requestedPage = query.page && Number(page) ? Number(page) : 1;
      //------ form search params--------
      let searchObj = {};
      if (id) {
        if (id.includes('m')) {
          searchObj = { modelID: id };
        }
        if (id.includes('g')) {
          searchObj = { generationID: id };
        }
      } else {
        searchObj = { code: brand };
      }

      //---request DB---------------------------
      await DBarticles.connectToMongo();
      const contentDB = await DBarticles.db
        .collection(articlesCollection)
        .find(searchObj)
        .sort({ publicationDate: -1 })
        .skip((requestedPage - 1) * articlePerPage)
        .limit(articlePerPage)
        .toArray();

      const totalRecDB = await DBarticles.db
        .collection(articlesCollection)
        .countDocuments(searchObj);

      const totalPage = Math.ceil(totalRecDB / articlePerPage);

      console.log(brand, 'id= ', id, query, requestedPage, searchObj);
      console.log(
        brand,
        'requestedPage ',
        requestedPage,
        ' total rec: ',
        totalRecDB,
        'articlePerPage ',
        articlePerPage,
        'totalPage ',
        totalPage
      );

      const articlesWithComments = await getLastCommentsForEachArticles(
        contentDB
      );
      let articlesSubscribe;
      articlesSubscribe = await getSubscribeInfoForEachArticles(
        articlesWithComments,
        req.headers.authorization
      );

      return res.json({
        currentPage: requestedPage,
        totalPage: totalPage,
        articles: articlesSubscribe,
      });
    } catch (err) {
      console.log(' articles error', err);
    }
  }

  async createComments(req, res) {
    try {
      const text = req.body.text;
      console.log('createComments', req.body);
      await DBarticles.connectToMongo();
      const recDB = await DBarticles.db.collection('comments').insertOne({
        user: 'someUser',
        comment: text,
        commentDate: Date.parse(new Date()),
        likes: 0,
      });
      console.log(recDB);
      return res.json({ message: recDB });
    } catch (err) {
      console.log(' createComments ', err);
    }
  }

  async createAnswer(req, res) {
    try {
      const text = req.body.text;
      const id = new ObjectId(req.body.commentId);
      console.log('createComments', req.body);
      await DBarticles.connectToMongo();
      const recDB = await DBarticles.db.collection('comments').findOne({
        _id: id,
      });

      let answers = recDB.answers ? recDB.answers : [];
      const answObj = [
        {
          user: 'someUser',
          answer: text,
          answerDate: Date.parse(new Date()),
          likes: 0,
        },
      ];

      const newAnswers = answObj.concat(answers);
      console.log(newAnswers);

      const updateDB = await DBarticles.db
        .collection('comments')
        .updateOne({ _id: id }, { $set: { answers: newAnswers } });

      return res.json({ message: updateDB });
    } catch (err) {
      console.log(' createAnswer ', err);
    }
  }

  async getComments(req, res) {
    try {
      console.log('getComments', req.body);
      await DBarticles.connectToMongo();
      const commentsDB = await DBarticles.db
        .collection('comments')
        .find({})
        .sort({ commentDate: -1 })
        .toArray();
      return res.json({ comments: commentsDB });
    } catch (err) {
      console.log(' createComments ', err);
    }
  }

  async getUser(req, res) {
    try {
      const userId = req.params.id;
      console.log('getUser ', userId);
      return res.json(userData);
    } catch (err) {
      console.log(' getUser ', err);
    }
  }

  async getUserCommunities(req, res) {
    try {
      console.log('getUserCommunities ');
      return res.json({ userCommunities: recomendedCommunities });
    } catch (err) {
      console.log(' getUserCommunities ', err);
    }
  }

  async getRecomendedCommunities(req, res) {
    try {
      console.log('getRecomendedCommunities ');
      return res.json({ recomendedCommunities: recomendedCommunities });
    } catch (err) {
      console.log(' getRecomendedCommunities ', err);
    }
  }

  async getNewCommunities(req, res) {
    try {
      console.log('getNewCommunities ');
      return res.json({ newCommunities: recomendedCommunities });
    } catch (err) {
      console.log(' getNewCommunities ', err);
    }
  }

  async getCommunityPage(req, res) {
    try {
      console.log('getCommunityPage ');
      return res.json({ communityPage });
    } catch (err) {
      console.log(' getCommunityPage ', err);
    }
  }

  async getCommunityBlogs(req, res) {
    try {
      console.log('getCommunityBlogs ');

      await DBarticles.connectToMongo();
      const communityBlogs = await DBarticles.db
        .collection(articlesCollection)
        .find({})
        .limit(9)
        .toArray();

      const responceArr = communityBlogs.map((v) => ({
        id: v._id,
        likes: v.likes,
        title: v.title,
        user: v.user,
        author: v.user,
        code: v.code,
        brand: v.brand,
        model: v.model,
        modelID: v.modelID,
        generation: v.generation,
        generationID: v.generationID,
        publicationDate: v.publicationDate,
        image: v.body.filter((el) => el.image)[0]
          ? v.body.filter((el) => el.image)[0].image
          : '',
        year: v.year,
        briefText:
          'ed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. ed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
      }));

      return res.json({ communityBlogs: responceArr });
    } catch (err) {
      console.log(' getCommunityPage ', err);
    }
  }

  async getCommunityForums(req, res) {
    try {
      console.log('getCommunityForums ');
      return res.json({ communityForums });
    } catch (err) {
      console.log(' getCommunityForums ', err);
    }
  }

  async getCommunityMembers(req, res) {
    try {
      console.log('getCommunityMembers ', req.params, req.query);
      let membersArr = [];
      // form memders list
      const items = req.query.list === 'false' ? 10 : 100;

      membersArr = Array(items).fill({
        avatar: 'https://a.d-cd.net/NLFsC38LzwSoup4BBSc3Wl_QLew-100.jpg',
        userId: '111',
      });

      return res.json({ communityMembers: membersArr });
    } catch (err) {
      console.log(' getCommunityMembers ', err);
    }
  }

  async sendArticle(req, res) {
    try {

      const {
        title,
        body,
        commentsAccess,
        articleAccess,
        mileageUnit,
        currencyUnit,
        mileageValue,
        currencyValue,
      } = req.body

      const recObj = {
        code: 'ac',
        brand: 'AC Cobra',
        model: 'AC Cobra',
        modelID: 'm0',
        generation: 'Cobra (1962)',
        generationID: 'g0',
        year: 1962,
        publicationDate: Date.parse(new Date()),
        user:'zikospider',
        author: "ZikoSpider",
        avatar: 'https://a.d-cd.net/8d89a0as-100.jpg',
        type: 'Article',
        title: title,
        body: body,
        mileage:{
          value:mileageValue,
          units:mileageUnit,
        },
        price: {
          value: currencyValue,
          currency: currencyUnit
        },
        likes:0,
        comments:0,
        commentsAccess,
        articleAccess,
        about: [0,1]
      }

      await DBarticles.connectToMongo();

      const record = await DBarticles.db
      .collection(articlesCollection)
      .insertOne(recObj)
      

      return res.json({ message: record });
    } catch (err) {
      console.log(' sendArticle ', err);
    }
  }

  async getText(req, res) {
    try {
      console.log('getText ');
      const rec = JSON.parse(
        fs.readFileSync('./someText.json', { encoding: 'utf8', flag: 'r' })
      );
      return res.json(rec);
    } catch (err) {
      console.log(' getText ', err);
    }
  }

  async getAdvertising(req, res) {
    try {
      console.log('getAdvertising ');
      return res.json({
        advertisingArr: [
          {
            itemName: 'Салонний фільтр',
            itemCode: 'CA1114',
            itemDescription: 'SAKURA',
          },
          {
            itemName: 'Масляний фільтр',
            itemCode: 'CA1114',
            itemDescription: 'SAKURA',
          },
          {
            itemName: 'Повітряний фільтр',
            itemCode: 'CA1114',
            itemDescription: 'SAKURA',
          },
          {
            itemName: 'Паливний фільтр',
            itemCode: 'CA1114',
            itemDescription: 'SAKURA',
          },
        ],
      });
    } catch (err) {
      console.log(' getText ', err);
    }
  }

  async subscribe(req, res) {
    try {
      const aim = req.params.aim;
      const aimId = req.query.id;
      console.log(aim, aimId);

      await DBarticles.connectToMongo();
      const contentDB = await DBarticles.db
        .collection('subscribes')
        .findOne({ type: aim, id: aimId });

      if (!contentDB) {
        const rec = await DBarticles.db
          .collection('subscribes')
          .insertOne({ type: aim, id: aimId });
        console.log('insert ', rec, aim, ' ', aimId);
        return res.json({
          status: { ok: true },
          process: 'insert',
          type: aim,
          id: aimId,
        });
      } else {
        const delRec = await DBarticles.db
          .collection('subscribes')
          .deleteOne({ type: aim, id: aimId });
        if (delRec && delRec.deletedCount >= 0) {
          console.log('deleteOne', aim, ' ', aimId);
          return res.json({
            status: { ok: true },
            process: 'del',
            type: aim,
            id: aimId,
          });
        }
      }

      return res.json({ status: { ok: false } });
    } catch (err) {
      console.log(' subscribe ', err);
    }
  }

  async logBooksLine(req, res) {
    try {
      const { brand, model, generation } = req.params;
      if (!brand) return res.json({ message: 'no params!' });
      const { sort, page, total } = req.query;
      const requestedPage = Number(page) ? Number(page) : 1;
      console.log('requestedPage ', requestedPage);

      const sortParams = () => {
        if (!sort || sort === 'likes') return { likes: -1 };
        if (sort === 'comments') return { comments: -1 };
        if (sort === 'date') return { publicationDate: -1 };
      };

      const searchParams = () => {
        if (generation) return { generationID: generation };
        if (model) return { modelID: model };
        if (brand) return { code: brand };
      };
      await DBarticles.connectToMongo();

      const totalRecDB = await DBarticles.db
      .collection(articlesCollection)
      .countDocuments(searchParams());

    const totalPage = Math.ceil(totalRecDB / articlePerPage);
    let recordsDB = []
      if (total) {
        recordsDB = await DBarticles.db
        .collection(articlesCollection)
        .find(searchParams())
        .sort(sortParams())
        .limit(requestedPage * articlePerPage)
        .toArray();
      } else {
      recordsDB = await DBarticles.db
        .collection(articlesCollection)
        .find(searchParams())
        .sort(sortParams())
        .skip((requestedPage - 1) * articlePerPage)
        .limit(articlePerPage)
        .toArray();
      }
        const articlesBrief = recordsDB.map(el => (
          {_id: el._id,
            title: el.title,
            titleImage: el.titleImage,
            summary: el.summary,
            publicationDate: el.publicationDate,
            likes: el.likes,
            comments: el.comments
            }
        ))
      return res.json({ articles: articlesBrief , page: requestedPage, totalPage: totalPage});
    } catch (err) {
      console.log('logBooksLine ', err);
    }
  }

  async enterManor(req, res) {
    try {
      const userId = 'roman-kuleba'
      return res.json({userId})

    } catch (err) {
      console.log('enterManor ', err);
    }
  
  }

  async getUserProfile(req, res) {
    try {
      const userId = req.params.id
      console.log('user profile ', userId)

      await DBarticles.connectToMongo();
      const userProfile = await DBarticles.db
      .collection('users_profiles')
      .findOne({userId:userId})
      
      return res.json({userProfile})

    } catch (err) {
      console.log('getUserProfile ', err);
    }
  }

  async updateUserProfile(req, res) {
    try {
      const {id, key, value } = req.body
      console.log(id, key, value)

      const obj_id = new ObjectId(id);
      await DBarticles.connectToMongo();
      const updateRec = await DBarticles.db
      .collection('users_profiles')
      .updateOne({_id: obj_id}, {$set:{[key]: value}})

      return res.json(updateRec)
    } catch (err) {
      console.log('updateUserProfile ', err);
    }
  }
}

module.exports = new UserController();
