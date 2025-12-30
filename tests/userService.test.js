const {
  loginUser,
  registerUser,
  getUserByEmail,
} = require("../service/userService");
const User = require("../models/userModel");
const { hashPassword, comparePassword } = require("../utils/hash");
const { getToken, storeTokenInDB } = require("../utils/auth");
const { validateEmail } = require("../utils/validEmail");

//Need this to Mock the functions
jest.mock("../models/userModel");
jest.mock("../utils/hash");
jest.mock("../utils/auth");
jest.mock("../utils/validEmail");

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

describe("loginUser function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return access token when login is successful", async () => {
    const testEmail = "john@example.com";
    const testPassword = "test123";

    const fakeDbResponse = {
      rowCount: 1,
      rows: [
        {
          id: "user-123",
          email: "john@example.com",
          password: "hashedPassword",
          role: "user",
        },
      ],
    };

    User.getPasswordByEmail.mockResolvedValue(fakeDbResponse);
    comparePassword.mockResolvedValue(true);
    getToken.mockReturnValue("fake.jwt.token");
    storeTokenInDB.mockResolvedValue(true);

    const result = await loginUser(testEmail, testPassword, mockLogger);
    expect(result).toEqual({ access_token: "fake.jwt.token" });
    expect(User.getPasswordByEmail).toHaveBeenCalledWith(testEmail);
    expect(comparePassword).toHaveBeenCalledWith(
      testPassword,
      "hashedPassword"
    );
    expect(getToken).toHaveBeenCalledWith({
      id: "user-123",
      email: "john@example.com",
      role: "user",
    });
  });

  it("should throw an error when user does not exist", async () => {
    const testEmail = "notfound@test.com";
    const testPassword = "thisisatest";

    const fakeDbResponse = {
      rowCount: 0,
      rows: [],
    };

    User.getPasswordByEmail.mockResolvedValue(fakeDbResponse);

    await expect(
      loginUser(testEmail, testPassword, mockLogger)
    ).rejects.toThrow("User with this email does not exist");
  });
  it("should throw an error when the password is not correct", async () => {
    const fakeDbResponse = {
      rowCount: 1,
      rows: [
        {
          id: "test123",
          email: "user@test.com",
          password: "wrongPasswordHash",
          role: "customer",
        },
      ],
    };

    const testEmail = "user@test.com";
    const testPassword = "wrong Password";
    User.getPasswordByEmail.mockResolvedValue(fakeDbResponse);
    comparePassword.mockResolvedValue(false);

    await expect(
      loginUser(testEmail, testPassword, mockLogger)
    ).rejects.toThrow("Please check your credentials");
  });
});

describe("registerUser function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register a new user successfully", async () => {
    let testName = "testUser";
    let testEmail = "test@test.com";
    let testPassword = "testPassword";

    hashPassword.mockResolvedValue("hashedPassword");

    const fakeDbResponse = {
      rowCount: 1,
    };

    User.register.mockResolvedValue(fakeDbResponse);

    let result = await registerUser(
      testName,
      testEmail,
      testPassword,
      mockLogger
    );

    expect(result).toEqual({ rowCount: 1 });
    expect(hashPassword).toHaveBeenCalledWith(testPassword);
    expect(User.register).toHaveBeenCalledWith(
      expect.any(String),
      testName,
      testEmail,
      "hashedPassword"
    );
  });
});

describe("getUserByEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should return user when email and matching user_id", async () => {
    let testEmail = "test@test.com";
    let testUserId = "testUser";
    let fakeDbResponse = {
      rowCount: 1,
      rows: [
        {
          id: "testUser",
          email: "test@test.com",
        },
      ],
    };

    validateEmail.mockReturnValue(true);

    User.getByEmail.mockResolvedValue(fakeDbResponse);

    let response = await getUserByEmail(testEmail, testUserId, mockLogger);
    expect(response).toEqual({
      rowCount: 1,
      rows: [{ id: testUserId, email: testEmail }],
    });
    expect(validateEmail).toHaveBeenCalledWith(testEmail);
    expect(User.getByEmail).toHaveBeenCalledWith(testEmail);
  });

  it("should throw error when user_id is missing", async () => {
    await expect(
      getUserByEmail("test@test.com", null, mockLogger)
    ).rejects.toThrow("No User ID");
  });

  it("should throw error when email is invalid", async () => {
    let testEmail = "invalidEmail";
    let testUserId = "testUserId";

    validateEmail.mockReturnValue(false);
    await expect(
      getUserByEmail(testEmail, testUserId, mockLogger)
    ).rejects.toThrow("The provided email is not valid");
  });

  it("should throw an error when user_id does not match", async () => {
    let testEmail = "test@test.com";
    let testUserId = "testUser";

    let fakeDbResponse = {
      rowCount: 1,
      rows: [
        {
          id: "testUser2",
          email: "test2@test.com",
        },
      ],
    };

    validateEmail.mockReturnValue(true);
    User.getByEmail.mockResolvedValue(fakeDbResponse);

    await expect(
      getUserByEmail(testEmail, testUserId, mockLogger)
    ).rejects.toThrow(
      "The requested user does not exist or you do not have the permission to access them"
    );
    expect(validateEmail).toHaveBeenCalledWith(testEmail);
    expect(User.getByEmail).toHaveBeenCalledWith(testEmail);
  });
});
