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
  await testUtils.connectDb("api-auth-permissions");
  // populate db collection with correct roles
  await testUtils.seedRoles();
  // populate db collection with test users
  await testUtils.seedUsers(testUsers);
});

const request = supertest(app);

// This is a suite of test that checks endpoint which restirct access to API endpoints based on user roles
describe("/api/test/all", () => {
  it("should return a response without a valid user session", async (done) => {
    const response = await request.get("/api/test/all");
    expect(response.status).toBe(200);
    expect(response.body.message).toEqual("Public Content.");
    done();
  });
});

describe("/api/test/user", () => {
  it("should return 403 when no token is provided", async (done) => {
    const response = await request.get("/api/test/user");
    expect(response.status).toBe(403);
    expect(response.body.message).toEqual("No token provided!");
    done();
  });

  it("should return 401 when an invalid token is provided", async (done) => {
    const response = await request
      .get("/api/test/user")
      .set("x-access-token", "invalidTokenString");
    expect(response.status).toBe(401);
    expect(response.body.message).toEqual("Unauthorized!");
    done();
  });

  it("should return 200 when a valid token is provided", async (done) => {
    const signInResponse = await request
      .post("/api/auth/signin")
      .send(testUsers[1]);

    const response = await request
      .get("/api/test/user")
      .set("x-access-token", signInResponse.body.accessToken);
    expect(response.status).toBe(200);
    expect(response.body.message).toEqual("User Content.");
    done();
  });
});

describe("/api/test/admin", () => {
  it("should return 403 when no token is provided", async (done) => {
    const response = await request.get("/api/test/admin");
    expect(response.status).toBe(403);
    expect(response.body.message).toEqual("No token provided!");
    done();
  });

  it("should return 401 when an invalid token is provided", async (done) => {
    const response = await request
      .get("/api/test/admin")
      .set("x-access-token", "invalidTokenString");
    expect(response.status).toBe(401);
    expect(response.body.message).toEqual("Unauthorized!");
    done();
  });

  it("should return 403 when a valid token with incorrect role is provided", async (done) => {
    const signInResponse = await request
      .post("/api/auth/signin")
      .send(testUsers[1]);

    const response = await request
      .get("/api/test/admin")
      .set("x-access-token", signInResponse.body.accessToken);
    expect(response.status).toBe(403);
    expect(response.body.message).toEqual("Require Admin Role!");
    done();
  });

  it("should return 200 when a valid token is provided", async (done) => {
    const signInResponse = await request
      .post("/api/auth/signin")
      .send(testUsers[0]);

    const response = await request
      .get("/api/test/admin")
      .set("x-access-token", signInResponse.body.accessToken);
    expect(response.status).toBe(200);
    expect(response.body.message).toEqual("Admin Content.");
    done();
  });
});

afterAll(async () => {
  await testUtils.dropAllCollections();
  await db.mongoose.connection.close();
});
