const { Connection } = require('../mongo/mongo');
const ObjectId = require('mongodb').ObjectId;
const { userData } = require('../userDataStub');
const { userCommunities } = require('../userCommunities');
const { recomendedCommunities } = require('../recomendedCommunities');
const { communityPage } = require('../communityPage');
const { communityForums } = require('../communityForums');
const fs = require('fs');

const articlesCollection = 'articles_standard_form_img_drive';

let articleObject = {};
const DBarticles = new Connection('articles');
const DBstructure = new Connection('brands_structure');

const articlePerPage = 4;

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
        const showedFields = {
          code: 0,
          brand: 0,
          model: 0,
          modelID: 0,
          generation: 0,
          generationID: 0,
          year: 0,
          user: 0,
          avatar: 0,
          author: 0,
          sourceUrl: 0,
          publicationDate: 1,
          type: 0,
          title: 1,
          body: 0,
          likes: 0,
          about: 0,
        };
        const allUsersArticle = await DBarticles.db
          .collection(articlesCollection)
          .find({ user: contentDB.user }, { showedFields })
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

      return res.json({
        article: Object.assign(
          { currentCarsInfo },
          { exCarsInfo },
          { prevArticle },
          { nextArticle },
          userData,
          contentDB
        ),
      });
    } catch (err) {
      console.log(' oneArticle ', err);
    }
  }

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

      return res.json({
        currentPage: requestedPage,
        totalPage: totalPage,
        articles: contentDB,
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
      return res.json({ userCommunities: userCommunities });
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
      articleObject = req.body.articleObj;
      console.log('sendArticle ', articleObject.body);
      fs.writeFileSync('./someText.json',JSON.stringify(articleObject))

      return res.json({ message: 'get article' });
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
}

module.exports = new UserController();
