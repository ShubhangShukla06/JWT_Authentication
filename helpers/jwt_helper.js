const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const client = require('./init_redis');

module.exports = {
  signAccessToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secrete = process.env.ACCESS_TOKEN_SECRETE;
      const options = {
        expiresIn: "1h",
        issuer: "website.com",
        audience: userId,
      };
      JWT.sign(payload, secrete, options, (err, token) => {
        if (err) {
          console.log(err.message);
          reject(createError.InternalServerError());
        }
        resolve(token);
      });
    });
  },
  verifyAccessToken: (req, res, next) => {
    if (!req.headers["authorization"]) return next(createError.Unauthorized());

    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRETE, (err, payload) => {
      if (err) {
        const message =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        return next(createError.Unauthorized(message));
      }
      req.payload = payload;
      next();
    });
  },
  signRefreshToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secrete = process.env.REFRESH_TOKEN_SECRETE;
      const options = {
        expiresIn: "1y",
        issuer: "website.com",
        audience: userId,
      };
      JWT.sign(payload, secrete, options, (err, token) => {
        if (err) {
          console.log(err.message);
          reject(createError.InternalServerError());
        }

        client.SET(userId, token, 'EX', 365 * 24 * 60 * 60, (err) => {
          if (err) {
            console.log(err.message);
            reject(createError.InternalServerError());
            return;
          }
          resolve(token);
        });
      });
    });
  },
  verifyRefreshToken: (refreshToken) => {
    return new Promise((resolve, reject) => {
      JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRETE, (err, payload) => {
        if (err) return reject(createError.Unauthorized());
        
        const userId = payload.aud;
        client.GET(userId, (err, result) => {
          if (err) {
            console.log(err.message);
            reject(createError.InternalServerError());
            return;
          }
          if (refreshToken === result) return resolve(userId);
          reject(createError.Unauthorized());
        });
      });
    });
  }
};
