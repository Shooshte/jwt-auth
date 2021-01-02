const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const role = require("./role.model");
const user = require("./user.model");

const db = {
  baseUrl: `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/`,
  mongoose: mongoose,
  role,
  roles: ["user", "admin"],
  user,
};

module.exports = db;
