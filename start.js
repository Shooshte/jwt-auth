require("dotenv").config();

// Setup initial database connection and add roles to the roles collection if not present
const db = require("./app/models");
const Role = db.role;

const DB_URL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`;

db.mongoose
  .connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to MongoDB.");
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

const app = require("./server");

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
