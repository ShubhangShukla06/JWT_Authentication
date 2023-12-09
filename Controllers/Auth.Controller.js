const createError = require("http-errors");
const User = require("../Models/User.model");
const { authSchema } = require("../helpers/validation_schema");
const client = require("../helpers/init_redis");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../helpers/jwt_helper");

module.exports = {
  register: async (req, res, next) => {
    try {
      const validResult = await authSchema.validateAsync(req.body);

      const doesExist = await User.findOne({ email: validResult.email });
      if (doesExist)
        throw createError.Conflict(
          `${validResult.email} is already been registered`
        );

      const user = new User(validResult);
      const savedUser = await user.save();

      const accessToken = await signAccessToken(savedUser.id);
      const refreshToken = await signRefreshToken(savedUser.id);

      res.send({ accessToken, refreshToken });
    } catch (error) {
      if (error.isJoi) error.status = 422;
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const validResult = await authSchema.validateAsync(req.body);

      const userExist = await User.findOne({ email: validResult.email });
      if (!userExist) throw createError.NotFound("User not found");

      const isMatch = await userExist.isValidPassword(validResult.password);
      if (!isMatch)
        throw createError.Unauthorized("Username or Password is not valid");

      const accessToken = await signAccessToken(userExist.id);
      const refreshToken = await signRefreshToken(userExist.id);

      res.send({ accessToken, refreshToken });
    } catch (error) {
      if (error.isJoi)
        return next(createError.BadRequest("Invalid Username or Password"));
      next(error);
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError.BadRequest();

      const userId = await verifyRefreshToken(refreshToken);

      const newAccessToken = await signAccessToken(userId);
      const newRefreshToken = await signRefreshToken(userId);

      res.send({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError.BadRequest();

      const userId = await verifyRefreshToken(refreshToken);
      client.DEL(userId, (err, val) => {
        if (err) {
          console.log(err.message);
          throw createError.InternalServerError();
        }
        console.log(val);
        res.sendStatus(204);
      });
    } catch (error) {
      next(error);
    }
  },
};
