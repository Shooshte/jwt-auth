const db = require("../app/models");
const Role = require("../app/models/role.model");

const connectDb = async (dbName) => {
  try {
    const url = `${db.baseUrl}${dbName}`;

    await db.mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (e) {
    throw e;
  }
};

const seedRoles = async () => {
  const Role = db.role;

  try {
    const count = await Role.estimatedDocumentCount();
    // if there are no roles in the DB, populate the DB with roles
    if (count === 0) {
      db.roles.forEach(async (role) => {
        try {
          const newRole = new Role({ name: role });
          await newRole.save();
        } catch (e) {
          throw e;
        }
      });
    }
  } catch (e) {
    throw e;
  }
};

const parseUserRoles = async (roles) => {
  try {
    // if roles are defined parse them to correct ID
    if (roles && roles.length > 0) {
      const foundRoles = await Role.find({ name: { $in: roles } });
      return foundRoles.map((role) => role.id);
    }
    // if roles are not defined default to the user role
    const userRole = await Role.findOne({ name: "user" });
    return [userRole._id];
  } catch (e) {
    throw e;
  }
};

const seedUsers = async (users) => {
  const User = db.user;

  try {
    const parsedUsers = await Promise.all(
      users.map(async (user) => {
        const roles = await parseUserRoles(user.roles);
        return { ...user, roles };
      })
    );

    parsedUsers.forEach(async (user) => {
      try {
        const newUser = new User(user);
        await newUser.save();
      } catch (e) {
        throw e;
      }
    });
  } catch (e) {
    throw e;
  }
};

async function dropAllCollections() {
  const collections = Object.keys(db.mongoose.connection.collections);
  for (const collectionName of collections) {
    const collection = db.mongoose.connection.collections[collectionName];
    try {
      await collection.drop();
    } catch (error) {
      // This error happens when you try to drop a collection that's already dropped. Happens infrequently.
      // Safe to ignore.
      if (error.message === "ns not found") return;
      // This error happens when you use it.todo.
      // Safe to ignore.
      if (
        error.message.includes("a background operation is currently running")
      ) {
        return;
      }
      console.log(error.message);
    }
  }
}

module.exports = {
  dropAllCollections,
  connectDb,
  seedRoles,
  seedUsers,
};
