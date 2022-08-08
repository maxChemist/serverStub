const { Connection } = require('../mongo/mongo');
const ObjectId = require('mongodb').ObjectId;

const DBarticles = new Connection('articles');
const DBstructure = new Connection('brands_structure');

const articlePerPage = 100;

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
      console.log(" getRecomendedArticles req")
      const query = req.query;
      const articlePerPage = 4
      const requestedPage = query.page && Number(page) ? Number(page) : 1;

      await DBarticles.connectToMongo();
      const totalRecDB = await DBarticles.db
      .collection('articles')
      .countDocuments({});

    const totalPage = Math.ceil(totalRecDB / articlePerPage);
      // const resArr = [
      //   { brand: 'alfaromeo', img: 'https://a.d-cd.net/4fcf7f2s-480.jpg' },
      //   { brand: 'bmw', img: 'https://a.d-cd.net/-lAAAgH_d-A-480.jpg' },
      //   { brand: 'ford', img: 'https://a.d-cd.net/51a9a8as-480.jpg' },
      //   { brand: 'hummer', img: 'https://a.d-cd.net/d409e2es-480.jpg' },
      // ];

      const allRecomendedArticle = await DBarticles.db
      .collection('articles')
      .find({})
      .sort({ likes: -1 })
      .skip((requestedPage - 1) * articlePerPage)
      .limit(articlePerPage)
      .toArray();


      const responceArr = allRecomendedArticle.map(v=>({
        id:v._id,
        likes:v.likes,
        title:v.title,
        user:v.user,
        code: v.code,
        brand: v.brand,
        model: v.model,
        modelID:v.modelID,
        generation: v.generation,
        generationID: v.generationID,
        publicationDate:v.publicationDate,
        img:v.body.filter(el=>el.img)[0].img,
        year:v.year
      }))

      return res.json(responceArr);
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
        .collection('articles')
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
          .collection('articles')
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

        const preIndex = currArticleIndex>0? currArticleIndex-1:-1
        const nextIndex = currArticleIndex<arr.length-1? currArticleIndex+1:-1
        
        if(preIndex>=0){
          prevArticle = {id:arr[preIndex]._id, title:arr[preIndex].title}
        }else{
          prevArticle=false
        }

        if(nextIndex>=0){
          nextArticle = {id:arr[nextIndex]._id, title:arr[nextIndex].title}
        }else{
          nextArticle=false
        }

        console.log('currArticleIndex ', currArticleIndex)
        console.log('preIndex ', preIndex)
        console.log('nextIndex ', nextIndex)
      }

      return res.json({
        article: Object.assign(
          { currentCarsInfo },
          { exCarsInfo },
          {prevArticle},
          {nextArticle},
           userData,
           contentDB,
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
        .collection('articles')
        .find(searchObj)
        .sort({ publicationDate: -1 })
        .skip((requestedPage - 1) * articlePerPage)
        .limit(articlePerPage)
        .toArray();

      const totalRecDB = await DBarticles.db
        .collection('articles')
        .countDocuments(searchObj);

      const totalPage = Math.ceil(totalRecDB / articlePerPage);

      console.log(brand, 'id= ',id, query, requestedPage, searchObj);
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
}

module.exports = new UserController();
