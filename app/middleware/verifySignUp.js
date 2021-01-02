const db = require("../models");
const ROLES = db.roles;
const User = db.user;

const validate = require("validate.js");

checkParameters = (req, res, next) => {
  // TODO add check for password strenght

  const constraints = {
    email: {
      presence: { allowEmpty: false },
      email: true,
    },
    username: {
      presence: { allowEmpty: false },
    },
    password: {
      presence: { allowEmpty: false },
    },
  };

  const errors = validate(req.body, constraints);

  if (errors) {
    res.status(400).send({ ...errors });
    return;
  }

  next();
};

checkDuplicateUsernameOrEmail = (req, res, next) => {
  // Username
  User.findOne({
    username: req.body.username,
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (user) {
      res.status(400).send({ message: "Failed! Username is already in use!" });
      return;
    }

    // Email
    User.findOne({
      email: req.body.email,
    }).exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (user) {
        res.status(400).send({ message: "Failed! Email is already in use!" });
        return;
      }

      next();
    });
  });
};

checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(400).send({
          message: `Failed! Role ${req.body.roles[i]} does not exist!`,
        });
        return;
      }
    }
  }

  next();
};

const verifySignUp = {
  checkParameters,
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
};

module.exports = verifySignUp;
