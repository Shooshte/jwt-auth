require("dotenv").config();

const app = require("../../server");
const supertest = require("supertest");
const db = require("../models");
const User = require("../models/user.model");
const e = require("express");

beforeAll(async () => {
  const databaseName = "api-test";
  const url = `${db.baseUrl}${databaseName}`;
  await db.mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const Role = db.role;

  // populate db collection with correct roles
  await Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      db.roles.forEach(async (role) => {
        try {
          const newRole = new Role({ name: role });
          await newRole.save();
        } catch (e) {
          throw e;
        }
      });
    } else {
      throw new Error(err);
    }
  });

  // populate db collection with test users
  await User.estimatedDocumentCount(async (err, count) => {
    if (!err && count === 0) {
      const testUsers = [
        {
          username: "adminTestUser",
          email: "admin@test.com",
          password: "test123!",
          roles: ["admin", "user"],
        },
        {
          username: "user1",
          email: "user1@test.com",
          password: "test123!",
          roles: ["user"],
        },
      ];

      // find and set role objectIds for the users
      const parsedTestUsers = await Promise.all(
        testUsers.map(async (user) => {
          try {
            if (user.roles && user.roles.length > 0) {
              // find the correct roles
              const foundRoles = await Role.find({ name: { $in: user.roles } });
              user.roles = foundRoles.map((role) => role._id);
            } else {
              const userRole = await Role.findOne({ name: "user" });
              user.roles = [userRole._id];
            }
            return user;
          } catch (e) {
            throw e;
          }
        })
      );

      parsedTestUsers.forEach(async (user) => {
        try {
          const newUser = new User(user);
          await newUser.save();
        } catch (e) {
          throw e;
        }
      });
    } else {
      throw new Error(err);
    }
  });
});

const request = supertest(app);

describe("/api/auth/signup", () => {
  it("should save a user to the DB when all the parameters are correct", async (done) => {
    const response = await request.post("/api/auth/signup").send({
      username: "testuser",
      email: "test@test.com",
      password: "test123!",
      roles: ["admin", "user"],
    });
    expect(response.status).toBe(200);

    const user = await db.user.findOne({ email: "test@test.com" });

    expect(user.email).toBeTruthy();
    expect(user.password).toBeTruthy();
    expect(user.roles).toBeTruthy();
    expect(user.username).toBeTruthy();

    done();
  });

  it("should return 400 when email is not provided", async (done) => {
    const response = await request.post("/api/auth/signup").send({
      username: "whatever",
      password: "sco0Omb3g",
      roles: ["user"],
    });
    expect(response.status).toBe(400);
    expect(response.body.email).toEqual(["Email can't be blank"]);
    done();
  });

  it("should return 400 when email is empty string", async (done) => {
    const response = await request.post("/api/auth/signup").send({
      email: "",
      username: "whatever",
      password: "sco0Omb3g",
      roles: ["user"],
    });
    expect(response.status).toBe(400);
    expect(response.body.email).toEqual([
      "Email can't be blank",
      "Email is not a valid email",
    ]);
    done();
  });

  it("should return 400 when email is not a valid email", async (done) => {
    const response = await request.post("/api/auth/signup").send({
      email: "fakeEmail@string",
      username: "whatever",
      password: "sco0Omb3g",
      roles: ["user"],
    });
    expect(response.status).toBe(400);
    expect(response.body.email).toEqual(["Email is not a valid email"]);
    done();
  });

  it("should return 400 when username is not present", async (done) => {
    const response = await request.post("/api/auth/signup").send({
      email: "fakeEmail@string",
      password: "sco0Omb3g",
      roles: ["user"],
    });
    expect(response.status).toBe(400);
    expect(response.body.username).toEqual(["Username can't be blank"]);
    done();
  });

  it("should return 400 when password is not present", async (done) => {
    const response = await request.post("/api/auth/signup").send({
      email: "fakeEmail@string",
      username: "fakeUser",
      roles: ["user"],
    });
    expect(response.status).toBe(400);
    expect(response.body.password).toEqual(["Password can't be blank"]);
    done();
  });

  it("should return 400 when email is already taken", async (done) => {
    const response = await request.post("/api/auth/signup").send({
      email: "admin@test.com",
      username: "newUser",
      password: "test123!",
      roles: ["admin", "user"],
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual("Failed! Email is already in use!");

    done();
  });

  it("should return 400 when username is already taken", async (done) => {
    const response = await request.post("/api/auth/signup").send({
      email: "admin123@test.com",
      username: "adminTestUser",
      password: "test123!",
      roles: ["admin", "user"],
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(
      "Failed! Username is already in use!"
    );

    done();
  });
});

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
      if (error.message.includes("a background operation is currently running"))
        return;
      console.log(error.message);
    }
  }
}

afterAll(async () => {
  await dropAllCollections();
  await db.mongoose.connection.close();
});
