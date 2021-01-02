require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

var corsOptions = {
  origin: process.env.ORIGIN,
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

const db = require("./app/models");
const Role = db.role;

db.mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit();
  });

// adding intial user roles to the roles collection
// TODO refactor initial DB setup into separate file
function initial() {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      db.ROLES.forEach((role) => {
        new Role({
          name: role,
        }).save((err) => {
          if (err) {
            console.log("error", err);
          }

          console.log(`Added ${role} to roles collection.`);
        });
      });
    }
  });
}

// set port, listen for requests
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
