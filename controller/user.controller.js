const { Connection } = require('../mongo/mongo');

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
      // console.log(brand, "page ", page, "query ", query)
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
      const resArr = [
        { brand: 'alfaromeo', img: 'https://a.d-cd.net/4fcf7f2s-480.jpg' },
        { brand: 'bmw', img: 'https://a.d-cd.net/-lAAAgH_d-A-480.jpg' },
        { brand: 'ford', img: 'https://a.d-cd.net/51a9a8as-480.jpg' },
        { brand: 'hummer', img: 'https://a.d-cd.net/d409e2es-480.jpg' },
      ];
      return res.json(resArr);
    } catch (err) {
      console.log('DB request STRUCTURE error', err);
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
      let searchObj={}  
      if(id){
        if(id.includes('m')){searchObj={modelID:id}}
        if(id.includes('g')){searchObj={generationID:id}}
      }else{
        searchObj={code:brand}
      }

      //---request DB---------------------------
      await DBarticles.connectToMongo();
      const contentDB = await DBarticles.db
      .collection('articles')
      .find( searchObj)
      .sort({ publicationDate: -1 })
      .skip((requestedPage - 1) * articlePerPage)
      .limit(articlePerPage)
      .toArray();
      
      const totalRecDB = await DBarticles.db
      .collection('articles')
      .countDocuments(searchObj);

      const totalPage = Math.ceil(totalRecDB / articlePerPage);

      console.log(brand,id,query, requestedPage,searchObj)
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
