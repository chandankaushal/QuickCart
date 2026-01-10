const {
  sendError,
  sendSuccess,
  setRefreshTokenCookie,
} = require("../../utils/apiResponse");

describe("API Response Utils", () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
  });

  describe("sendError", () => {
    it("should send error response with default status 400", () => {
      sendError(mockRes, "Something went wrong");

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Something went wrong",
      });
    });

    it("should send error response with custom status", () => {
      sendError(mockRes, "Not found", 404);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Not found",
      });
    });

    it("should send error response with 500 status", () => {
      sendError(mockRes, "Internal server error", 500);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should handle empty message", () => {
      sendError(mockRes, "");

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "",
      });
    });
  });

  describe("sendSuccess", () => {
    it("should send success response with default status 200", () => {
      sendSuccess(mockRes, "Operation successful", { id: 1 });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        message: "Operation successful",
        data: { id: 1 },
      });
    });

    it("should send success response with custom status", () => {
      sendSuccess(mockRes, "Created", { id: 1 }, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should send success response without message", () => {
      sendSuccess(mockRes, null, { id: 1 });

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: { id: 1 },
      });
    });

    it("should send success response with empty data", () => {
      sendSuccess(mockRes, "Done", {});

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        message: "Done",
        data: {},
      });
    });

    it("should send success response with array data", () => {
      const arrayData = [{ id: 1 }, { id: 2 }];
      sendSuccess(mockRes, "List retrieved", arrayData);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        message: "List retrieved",
        data: arrayData,
      });
    });

    it("should handle null data", () => {
      sendSuccess(mockRes, "No content", null);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        message: "No content",
      });
    });
  });

  describe("setRefreshTokenCookie", () => {
    it("should set refresh token cookie with correct options", () => {
      const token = "refresh-token-123";

      setRefreshTokenCookie(mockRes, token);

      expect(mockRes.cookie).toHaveBeenCalledWith("refresh_token", token, {
        httpOnly: true,
        secure: false, // NODE_ENV is not 'production' in tests
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    });

    it("should set httpOnly to true for security", () => {
      setRefreshTokenCookie(mockRes, "token");

      const cookieOptions = mockRes.cookie.mock.calls[0][2];
      expect(cookieOptions.httpOnly).toBe(true);
    });

    it("should set sameSite to strict", () => {
      setRefreshTokenCookie(mockRes, "token");

      const cookieOptions = mockRes.cookie.mock.calls[0][2];
      expect(cookieOptions.sameSite).toBe("strict");
    });

    it("should set maxAge to 7 days in milliseconds", () => {
      setRefreshTokenCookie(mockRes, "token");

      const cookieOptions = mockRes.cookie.mock.calls[0][2];
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      expect(cookieOptions.maxAge).toBe(sevenDaysInMs);
    });
  });
});
