require("dotenv").config();

const app = require("../../server");
const supertest = require("supertest");
const db = require("../models");

const testUtils = require("../../utils/test.utils");

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

beforeAll(async () => {
  // open mongoose db connection
  await testUtils.connectDb("api-auth-signup");
  // populate db collection with correct roles
  await testUtils.seedRoles();
  // populate db collection with test users
  await testUtils.seedUsers(testUsers);
});

const request = supertest(app);

describe("/api/auth/signup", () => {
  it("should save a user to the DB when all the parameters are correct", async (done) => {
    const response = await request.post("/api/auth/signup").send({
      username: "admin",
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

  // TODO add test that the default role when not passed is user
});

describe("/api/auth/signin", () => {
  it("should return 404 when user is not found", async (done) => {
    const response = await request.post("/api/auth/signin").send({
      username: "veryLegitUser",
      password: "veryLegitPassword",
    });
    expect(response.status).toBe(404);
    expect(response.body.message).toEqual("User Not found.");
    done();
  });

  it("should return 401 when password is incorrect", async (done) => {
    const response = await request.post("/api/auth/signin").send({
      username: "adminTestUser",
      password: "veryLegitPassword",
    });
    expect(response.status).toBe(401);
    expect(response.body.message).toEqual("Invalid Password!");
    done();
  });

  it("should return the correct data when username and password are correct", async (done) => {
    const response = await request.post("/api/auth/signin").send(testUsers[0]);

    expect(response.status).toBe(200);
    expect(response.body.id).toBeTruthy();
    expect(response.body.username).toEqual(testUsers[0].username);
    expect(response.body.email).toEqual(testUsers[0].email);
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.roles).toEqual(["user", "admin"]);
    done();
  });
});

afterAll(async () => {
  await testUtils.dropAllCollections();
  await db.mongoose.connection.close();
});
