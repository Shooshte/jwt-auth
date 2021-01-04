const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const role = require("./role.model");
const user = require("./user.model");

const baseUrl =
  process.env.NODE_ENV === "test"
    ? `mongodb+srv://${process.env.TEST_DB_USERNAME}:${process.env.TEST_DB_PASSWORD}@${process.env.TEST_DB_HOST}/`
    : `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/`;

const db = {
  baseUrl,
  mongoose: mongoose,
  role,
  roles: ["user", "admin"],
  user,
};

module.exports = db;
