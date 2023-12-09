const express = require("express");
const authController = require("../Controllers/Auth.Controller");

const route = express.Router();

route.post("/register", authController.register);

route.post("/login", authController.login);

route.post("/refresh-token", authController.refreshToken);

route.delete("/logout", authController.logout);

module.exports = route;
