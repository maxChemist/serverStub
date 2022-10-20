const jwt = require("jsonwebtoken");
const jwkToPem = require('jwk-to-pem');
const fs = require("fs")

module.exports = function (req, res, next) {
  if (req.method === "OPTIONS") {
    next();
  }

  try {
    const token = req.headers.authorization;
    console.log('authMiddleware ', token)
    if (!token) {
      return res.status(401).json({ message: "Пользователь не авторизован" });
    }

    const jwk = JSON.parse(fs.readFileSync('jwks.json'))  
    console.log('jwk ', jwk)
    const pem = jwkToPem(jwk.keys[0])
    console.log('pem ', pem)
    jwt.verify(token, pem, { algorithms: ['RS256'] }, 
    function(err, decodedToken) {
        console.log('err ', err)
        console.log('decodedToken ', decodedToken)
    })

    next();
  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: "Пользователь не авторизован" });
  }
};
