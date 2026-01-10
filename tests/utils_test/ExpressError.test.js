const { ExpressError } = require("../../utils/ExpressError");

describe("ExpressError", () => {
  describe("constructor", () => {
    it("should create error with message, statusCode, and code", () => {
      const error = new ExpressError("Not found", 404, "NOT_FOUND");

      expect(error.message).toBe("Not found");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
    });

    it("should use default statusCode of 500", () => {
      const error = new ExpressError("Server error");

      expect(error.statusCode).toBe(500);
    });

    it("should use default code of ERROR_NOT_HANDLED", () => {
      const error = new ExpressError("Some error");

      expect(error.code).toBe("ERROR_NOT_HANDLED");
    });

    it("should extend Error class", () => {
      const error = new ExpressError("Test error");

      expect(error instanceof Error).toBe(true);
      expect(error instanceof ExpressError).toBe(true);
    });

    it("should have a stack trace", () => {
      const error = new ExpressError("Test error");

      expect(error.stack).toBeDefined();
    });

    it("should handle empty message", () => {
      const error = new ExpressError("");

      expect(error.message).toBe("");
    });
  });

  describe("common HTTP status codes", () => {
    it("should handle 400 Bad Request", () => {
      const error = new ExpressError("Bad request", 400, "BAD_REQUEST");

      expect(error.statusCode).toBe(400);
    });

    it("should handle 401 Unauthorized", () => {
      const error = new ExpressError("Unauthorized", 401, "UNAUTHORIZED");

      expect(error.statusCode).toBe(401);
    });

    it("should handle 403 Forbidden", () => {
      const error = new ExpressError("Forbidden", 403, "FORBIDDEN");

      expect(error.statusCode).toBe(403);
    });

    it("should handle 404 Not Found", () => {
      const error = new ExpressError("Not found", 404, "NOT_FOUND");

      expect(error.statusCode).toBe(404);
    });

    it("should handle 409 Conflict", () => {
      const error = new ExpressError("Conflict", 409, "CONFLICT");

      expect(error.statusCode).toBe(409);
    });

    it("should handle 422 Unprocessable Entity", () => {
      const error = new ExpressError(
        "Validation failed",
        422,
        "VALIDATION_ERROR"
      );

      expect(error.statusCode).toBe(422);
    });

    it("should handle 500 Internal Server Error", () => {
      const error = new ExpressError(
        "Internal error",
        500,
        "INTERNAL_SERVER_ERROR"
      );

      expect(error.statusCode).toBe(500);
    });

    it("should handle 503 Service Unavailable", () => {
      const error = new ExpressError(
        "Service unavailable",
        503,
        "SERVICE_UNAVAILABLE"
      );

      expect(error.statusCode).toBe(503);
    });
  });

  describe("throwable behavior", () => {
    it("should be throwable and catchable", () => {
      expect(() => {
        throw new ExpressError("Test error", 400);
      }).toThrow(ExpressError);
    });

    it("should be catchable with try-catch", () => {
      try {
        throw new ExpressError("Test error", 404, "NOT_FOUND");
      } catch (error) {
        expect(error.message).toBe("Test error");
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe("NOT_FOUND");
      }
    });

    it("should work with Promise.reject", async () => {
      const promise = Promise.reject(
        new ExpressError("Async error", 500, "ASYNC_ERROR")
      );

      await expect(promise).rejects.toThrow(ExpressError);
      await expect(promise).rejects.toMatchObject({
        message: "Async error",
        statusCode: 500,
        code: "ASYNC_ERROR",
      });
    });
  });
});
