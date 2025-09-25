const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const ActivityLogger = require("../utils/activityLogger");

describe("Authentication Endpoints", () => {
  describe("POST /api/auth/register", () => {
    const validUser = {
      name: "Jane Doe",
      username: "farmer_jane",
      displayName: "Janes Southside Ranch",
      email: "jane@example.com",
      password: "passWord123!",
      location: "Southside, TX",
      farmType: "small-scale",
    };

    test("should register a new user", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(validUser)
        .expect(201);

      expect(response.body).toHaveProperty(
        "message",
        "User registered successfully"
      );
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toMatchObject({
        name: validUser.name,
        username: validUser.username,
        displayName: validUser.displayName,
        email: validUser.email,
        location: validUser.location,
        farmType: validUser.farmType,
      });
      expect(response.body.user).not.toHaveProperty("password");
    });

    test("should reject registration with missing required fields", async () => {
      const invalidUser = {
        name: "John Smith",
        email: "john@example.com",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(invalidUser)
        .expect(400);

      expect(response.body.message).toContain(
        "Please provide name, username, email, and password"
      );
    });

    test("should reject duplicate email", async () => {
      // Create first user
      await request(app).post("/api/auth/register").send(validUser).expect(201);

      // Try to create another user with the same email
      const duplicateEmailUser = {
        ...validUser,
        username: "different_username",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(duplicateEmailUser)
        .expect(400);

      expect(response.body.message).toBe("Email already registered");
    });

    test("should reject duplicate username", async () => {
      // create first user
      await request(app).post("/api/auth/register").send(validUser).expect(201);

      // Try to create another user with the same username
      const duplicateUsernameUser = {
        ...validUser,
        email: "different_email@example.com",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(duplicateUsernameUser)
        .expect(400);

      expect(response.body.message).toBe("Username already taken");
    });

    test("should default displayName to name if not provided", async () => {
      const userWithoutDisplayName = {
        name: "John Appleseed",
        username: "john_appleseed",
        email: "johnny@example.com",
        password: "Password123!",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userWithoutDisplayName)
        .expect(201);

      expect(response.body.user.displayName).toBe(userWithoutDisplayName.name);
    });
  });
});

describe("POST /api/auth/login", () => {
  const testUser = {
    name: "John Smith",
    username: "farmer_john",
    email: "john@example.com",
    password: "Password123!",
    farmType: "small-scale",
  };

  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(testUser);
  });

  test("should login with email successfully", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        emailOrUsername: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body).toHaveProperty("message", "Login Successful");
    expect(response.body).toHaveProperty("token");
    expect(response.body.user.email).toBe(testUser.email);
  });

  test("should login with username successfully", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        emailOrUsername: testUser.username,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body).toHaveProperty("message", "Login Successful");
    expect(response.body).toHaveProperty("token");
    expect(response.body.user.username).toBe(testUser.username);
  });

  test("should reject login with wrong password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        emailOrUsername: testUser.email,
        password: "WrongPassword!",
      })
      .expect(401);

    expect(response.body.message).toBe("Invalid credentials");
  });

  test("should reject login with non-existent user", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        emailOrUsername: "nonexistent@example.com",
        password: "Password123!",
      })
      .expect(401);

    expect(response.body.message).toBe("Invalid credentials");
  });

  test("should reject login with missing credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        emailOrUsername: testUser.email,
        // missing password
      })
      .expect(400);

    expect(response.body.message).toBe(
      "Please provide email/username and password"
    );
  });
});

describe("GET /api/auth/profile (Protected Route)", () => {
  const testUser = {
    name: "John Smith",
    username: "farmer_john",
    email: "john@example.com",
    password: "password123",
    farmType: "small-scale",
  };

  let authToken;
  let userId;

  beforeEach(async () => {
    // Register a test user to get a valid token
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  test("should access profile with valid token", async () => {
    const response = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty(
      "message",
      "Profile accessed successfully"
    );
    expect(response.body.user).toMatchObject({
      name: testUser.name,
      username: testUser.username,
      email: testUser.email,
      farmType: testUser.farmType,
    });

    expect(response.body.user).not.toHaveProperty("password");
  });

  test("should reject access without token", async () => {
    const response = await request(app).get("/api/users/profile").expect(401);

    expect(response.body.message).toBe("Access denied. No token provided.");
  });

  test("should reject access with invalid token", async () => {
    const response = await request(app)
      .get("/api/users/profile")
      .set("Authorization", "Bearer invalid_token_here")
      .expect(401);

    expect(response.body.message).toBe("Invalid token.");
  });
});

describe('PATCH /api/users/profile (Updated Profile)', () => {
  const testUser = {
    name: 'Jane Smith',
    username: 'profule_jane',
    email: 'jane@example.com',
    password: 'password321',
    farmType: 'hobby',
  };

  let authToken;

  beforeEach(async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser);

      authToken = registerResponse.body.token;
  });

  test('should update user profile successfully', async () => {
    const updates = {
      name: 'Jane Updated Smith',
      displayName: 'Janes Urban Farm',
      location: 'Austin, TX',
      farmType: 'small-scale',
    };

    const response = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updates)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Profile updated successfully');
    expect(response.body.user).toMatchObject(updates);
    expect(response.body.user).not.toHaveProperty('password');
  });

  test('should update partial profile information', async () => {
    const updates = {
      displayName: 'Janes Fancy Urban Farm',
    };

    const response = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updates)
      .expect(200);

    expect(response.body.user.displayName).toBe(updates.displayName);
    expect(response.body.user.name).toBe(testUser.name);
  });

  test('should reject name longer than 25 characters', async () => {
    const updates = { name: 'This name is longer than twenty five characters and should be rejected'};

    const response = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updates)
      .expect(400);

    expect(response.body.message).toBe('Name must be 25 characters or less');
  });

  test('should reject invalid location format', async () => {
    const updates = { location: 'InvalidLocationFormat' };

    const response = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updates)
      .expect(400);

    expect(response.body.message).toBe('Location must be in format: City, State');
  });

  test('should require authentication', async () => {
    const updates = { name: 'Should Fail' };

    const response = await request(app)
      .patch('/api/users/profile')
      .send(updates)
      .expect(401);

    expect(response.body.message).toBe('Access denied. No token provided.');
  });
});

/* describe("Activity Logging", () => {
  test("Should log account creation during registration", async () => {
    const testUser = {
      name: "Activity Test User",
      username: "activity_test",
      email: "activity@example.com",
      password: "Password123!",
      farmType: "small-scale",
    };

    const response = await request(app)
      .post("/api/auth/register")
      .send(testUser)
      .expect(201);

    const userId = response.body.user.id;

    const activities = await ActivityLogger.getUserActivity(userId);

    expect(activities).toHaveLength(1);
    expect(activities[0].action).toBe("account_created");
    expect(activities[0].changes.account.username).toBe(testUser.username);
  });

  test("should retrieve user activity", async () => {
    const testUser = {
      name: "Activity Get Test",
      username: "activity_get_test",
      email: "activityget@example.com",
      password: "password123",
    };

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    const token = registerResponse.body.token;

    const response = await request(app)
      .get("/api/auth/activity")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty(
      "message",
      "Activity retrieved successfully"
    );
    expect(response.body.activities).toBeInstanceOf(Array);
    expect(response.body.activities.length).toBeGreaterThan(0);
  });
});
*/