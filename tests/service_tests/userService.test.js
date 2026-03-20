jest.mock("../../utils/aws/ses_email", () =>
  jest.fn().mockResolvedValue({ info: "testObject" }),
);
const {
  loginUser,
  registerUser,
  getUserByEmail,
  new_access_token_from_refresh_token,
} = require("../../service/userService");
const User = require("../../models/userModel");
const { hashPassword, comparePassword } = require("../../utils/hash");
const {
  getToken,
  storeTokenInDB,
  refreshToken,
  storeRefreshTokenInDB,
  storeSignUpTokenInDB,
  signUpToken,
} = require("../../utils/auth");
const jwt_token = require("../../models/jwtTokenModel");
const { validateEmail } = require("../../utils/validEmail");
const withTransaction = require("../../utils/withTransaction");
const { any } = require("joi");

const sendToQueue = require("../../queues/sendToQueue");
//Need this to Mock the functions
jest.mock("../../models/userModel");
jest.mock("../../utils/hash");
jest.mock("../../utils/auth");
jest.mock("../../utils/validEmail");
jest.mock("../../models/jwtTokenModel");
jest.mock("../../utils/withTransaction", () => jest.fn());
jest.mock("../../queues/sendToQueue");

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
const mockClient = {};
signUpToken.mockImplementation(() => "dummyToken");

describe("loginUser function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return access token when login is successful", async () => {
    const testEmail = "john@example.com";
    const testPassword = "test123";
    const isActiveResponse = {
      rows: [
        {
          verified: true,
        },
      ],
    };

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
    User.isUserActive.mockResolvedValue(isActiveResponse);
    getToken.mockReturnValue("fake.jwt.token");
    storeTokenInDB.mockResolvedValue(true);
    storeRefreshTokenInDB.mockResolvedValue(true);

    const result = await loginUser(testEmail, testPassword, mockLogger);
    expect(result).toEqual({ access_token: "fake.jwt.token" });
    expect(User.getPasswordByEmail).toHaveBeenCalledWith(testEmail);
    expect(comparePassword).toHaveBeenCalledWith(
      testPassword,
      "hashedPassword",
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
      loginUser(testEmail, testPassword, mockLogger),
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
      loginUser(testEmail, testPassword, mockLogger),
    ).rejects.toThrow("Please check your credentials");
  });
});

describe("registerUser function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    withTransaction.mockImplementation(async (callback) => {
      return await callback(mockClient);
    });
  });

  it("should register a new user successfully", async () => {
    let testName = "testUser";
    let testEmail = "test@test.com";
    let testPassword = "testPassword";
    let userObj = {
      id: expect.any(String),
      name: testName,
      role: "user",
    };
    hashPassword.mockResolvedValue("hashedPassword");

    const fakeDbResponse = {
      rowCount: 1,
    };
    let sendToQueueResponse = { messageId: "test-message" };

    User.register.mockResolvedValue(fakeDbResponse);
    storeSignUpTokenInDB.mockResolvedValue({ token_id: "testToken" });
    sendToQueue.mockResolvedValue(sendToQueueResponse);

    let result = await registerUser(
      testName,
      testEmail,
      testPassword,
      mockLogger,
      mockClient,
    );

    expect(result).toEqual("testToken");
    expect(hashPassword).toHaveBeenCalledWith(testPassword);

    expect(User.register).toHaveBeenCalledWith(
      expect.any(String),
      testName,
      testEmail,
      "hashedPassword",
      mockClient,
    );
    expect(signUpToken).toHaveBeenCalledWith(userObj);
    expect(sendToQueue).toHaveBeenCalled();
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
      getUserByEmail("test@test.com", null, mockLogger),
    ).rejects.toThrow("No User ID");
  });

  it("should throw error when email is invalid", async () => {
    let testEmail = "invalidEmail";
    let testUserId = "testUserId";

    validateEmail.mockReturnValue(false);
    await expect(
      getUserByEmail(testEmail, testUserId, mockLogger),
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
      getUserByEmail(testEmail, testUserId, mockLogger),
    ).rejects.toThrow(
      "The requested user does not exist or you do not have the permission to access them",
    );
    expect(validateEmail).toHaveBeenCalledWith(testEmail);
    expect(User.getByEmail).toHaveBeenCalledWith(testEmail);
  });
  describe("Refresh Token Tests", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it("should generate a refresh token when valid token is passed", async () => {
      let jti = "abc123";
      let token = "token";
      let fakeRefreshToken = "refresh token";
      let userObj = {
        id: "user123",
        email: "fakeUser@test.com",
        role: "fakeRole",
      };

      let jwtTokenDbResponse = {
        rowCount: 1,
      };

      let finalResult = {
        access_token: token,
        refresh_token: fakeRefreshToken,
      };
      jwt_token.deleteRefreshTokenFromDb.mockResolvedValue(jwtTokenDbResponse);
      getToken.mockReturnValue(token);
      refreshToken.mockReturnValue(fakeRefreshToken);
      storeTokenInDB.mockResolvedValue(true);
      storeRefreshTokenInDB.mockResolvedValue(true);

      let result = await new_access_token_from_refresh_token(
        jti,
        userObj,
        mockLogger,
      );

      expect(result).toEqual(finalResult);
    });

    it("should return an error when storing token in DB fails", async () => {
      let jti = "abc123";
      let token = "token";
      let fakeRefreshToken = "refresh token";
      let userObj = {
        id: "user123",
        email: "fakeUser@test.com",
        role: "fakeRole",
      };

      let jwtTokenDbResponse = {
        rowCount: 1,
      };

      jwt_token.deleteRefreshTokenFromDb.mockResolvedValue(jwtTokenDbResponse);
      getToken.mockReturnValue(token);
      refreshToken.mockReturnValue(fakeRefreshToken);
      storeTokenInDB.mockResolvedValue(true);
      storeRefreshTokenInDB.mockRejectedValue(
        new Error(
          "There was an error with your request. Please try again later",
        ),
      );

      await expect(
        new_access_token_from_refresh_token(jti, userObj, mockLogger),
      ).rejects.toThrow(
        "There was an error with your request. Please try again later",
      );
    });
  });
  it("should not return errors if storing token in db fails", async () => {
    let jti = "abc123";
    let token = "token";
    let fakeRefreshToken = "refresh token";
    let userObj = {
      id: "user123",
      email: "fakeUser@test.com",
      role: "fakeRole",
    };

    let jwtTokenDbResponse = {
      rowCount: 1,
    };
    let finalResult = {
      access_token: token,
      refresh_token: fakeRefreshToken,
    };
    jwt_token.deleteRefreshTokenFromDb.mockResolvedValue(jwtTokenDbResponse);
    getToken.mockReturnValue(token);
    refreshToken.mockReturnValue(fakeRefreshToken);
    storeTokenInDB.mockRejectedValue(false);
    storeRefreshTokenInDB.mockResolvedValue(true);
    let result = await new_access_token_from_refresh_token(
      jti,
      userObj,
      mockLogger,
    );
    expect(result).toEqual(finalResult);
    expect(mockLogger.warn).toHaveBeenCalled();
  });
  it("should throw an error when delete from Db fails", async () => {
    let jti = "abc123";
    let userObj = {
      id: "user123",
      email: "fakeUser@test.com",
      role: "fakeRole",
    };
    jwt_token.deleteRefreshTokenFromDb.mockRejectedValue(
      new Error("DB Failure"),
    );
    await expect(
      new_access_token_from_refresh_token(jti, userObj, mockLogger),
    ).rejects.toThrow("DB Failure");
    expect(getToken).not.toHaveBeenCalled();
    expect(refreshToken).not.toHaveBeenCalled();
    expect(storeTokenInDB).not.toHaveBeenCalled();
    expect(storeRefreshTokenInDB).not.toHaveBeenCalled();
    expect(jwt_token.deleteRefreshTokenFromDb).toHaveBeenCalledWith(jti);
  });
  // Add these inside "Refresh Token Tests" describe block

  it("should log warning but continue when deleteRefreshTokenFromDb returns rowCount 0", async () => {
    let jti = "abc123";
    let token = "token";
    let fakeRefreshToken = "refresh token";
    let userObj = {
      id: "user123",
      email: "fakeUser@test.com",
      role: "fakeRole",
    };

    jwt_token.deleteRefreshTokenFromDb.mockResolvedValue({ rowCount: 0 });
    getToken.mockReturnValue(token);
    refreshToken.mockReturnValue(fakeRefreshToken);
    storeTokenInDB.mockResolvedValue(true);
    storeRefreshTokenInDB.mockResolvedValue(true);

    let result = await new_access_token_from_refresh_token(
      jti,
      userObj,
      mockLogger,
    );

    expect(result).toEqual({
      access_token: token,
      refresh_token: fakeRefreshToken,
    });
    expect(mockLogger.warn).toHaveBeenCalledWith("Nothing to remove from DB");
  });

  it("should call getToken and refreshToken with correct userObj", async () => {
    let jti = "abc123";
    let token = "token";
    let fakeRefreshToken = "refresh token";
    let userObj = {
      id: "user123",
      email: "fakeUser@test.com",
      role: "fakeRole",
    };

    jwt_token.deleteRefreshTokenFromDb.mockResolvedValue({ rowCount: 1 });
    getToken.mockReturnValue(token);
    refreshToken.mockReturnValue(fakeRefreshToken);
    storeTokenInDB.mockResolvedValue(true);
    storeRefreshTokenInDB.mockResolvedValue(true);

    await new_access_token_from_refresh_token(jti, userObj, mockLogger);

    expect(getToken).toHaveBeenCalledWith(userObj);
    expect(refreshToken).toHaveBeenCalledWith(userObj);
  });

  it("should call storeTokenInDB and storeRefreshTokenInDB with generated tokens", async () => {
    let jti = "abc123";
    let token = "generated-access-token";
    let fakeRefreshToken = "generated-refresh-token";
    let userObj = {
      id: "user123",
      email: "fakeUser@test.com",
      role: "fakeRole",
    };

    jwt_token.deleteRefreshTokenFromDb.mockResolvedValue({ rowCount: 1 });
    getToken.mockReturnValue(token);
    refreshToken.mockReturnValue(fakeRefreshToken);
    storeTokenInDB.mockResolvedValue(true);
    storeRefreshTokenInDB.mockResolvedValue(true);

    await new_access_token_from_refresh_token(jti, userObj, mockLogger);

    expect(storeTokenInDB).toHaveBeenCalledWith(token);
    expect(storeRefreshTokenInDB).toHaveBeenCalledWith(fakeRefreshToken);
  });
});
