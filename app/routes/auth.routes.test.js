require("dotenv").config();

const app = require("../../server");
const supertest = require("supertest");
const db = require("../models");

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
      db.roles.forEach((role) => {
        new Role({
          name: role,
        }).save((err) => {
          if (err) {
            throw new Error(err);
          }
        });
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
      email: "test@test.com",
      username: "test",
      password: "test123!",
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

  // TODO add test for duplicate email
  // TODO add test for duplicate username
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
