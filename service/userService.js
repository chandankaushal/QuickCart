const { validateEmail } = require("../utils/validEmail");
const User = require("../models/userModel");
const jwt_token = require("../models/jwtTokenModel");
const { ExpressError } = require("../utils/ExpressError");
const { comparePassword, hashPassword } = require("../utils/hash");
const {
  getToken,
  storeTokenInDB,
  refreshToken,
  storeRefreshTokenInDB,
  signUpToken,
  storeSignUpTokenInDB,
} = require("../utils/auth");
const crypto = require("crypto");
const logger = require("../utils/logger");
const withTransaction = require("../utils/withTransaction");

async function getUserByEmail(email, user_id, log = logger) {
  if (!user_id) {
    throw new ExpressError("No User ID", 400, "NO_USER_ID");
  }
  log.info({ email }, "Validating Email");
  let isValid = validateEmail(email);

  if (isValid) {
    let response = await User.getByEmail(email);
    if (response.rowCount >= 1 && user_id == response.rows[0].id) {
      log.info(`Found User`, response.rows[0].id);
      return response;
    } else {
      throw new ExpressError(
        "The requested user does not exist or you do not have the permission to access them",
        400,
        "NO_USER_FOUND",
      );
    }
  } else {
    throw new ExpressError(
      "The provided email is not valid",
      400,
      "INVALID_EMAIL",
    );
  }
}

async function loginUser(email, password, log = logger) {
  log.info("Getting User by Email");
  const response = await User.getPasswordByEmail(email);
  if (response.rowCount === 0) {
    throw new ExpressError(
      "User with this email does not exist",
      400,
      "NO_USER_EXISTS",
    );
  }
  log.info("Comparing Passwords");
  let result = await comparePassword(password, response.rows[0].password);
  if (result) {
    let userObj = {
      id: response.rows[0].id,
      email: response.rows[0].email,
      role: response.rows[0].role,
    };
    let access_token = getToken(userObj);
    log.info("Generated Access Token");
    let refresh_token = refreshToken(userObj);
    // console.log(`Generated Refresh Token ${refreshToken}`);

    // NO await in storing token because we dont want to block.
    log.info("Storing token in DB");
    storeTokenInDB(access_token).catch((err) =>
      log.warn(`${err},"Failed to store token in DB`),
    );
    // console.log("Storing Refresh Token in DB");
    storeRefreshTokenInDB(refresh_token).catch((err) =>
      log.warn(`${err},"Failed to store refresh token in DB`),
    );

    return { access_token: access_token, refresh_token: refresh_token };
  } else {
    throw new ExpressError(
      "Please check your credentials",
      401,
      "UNAUTHORIZED",
    );
  }
}

async function registerUser(name, email, password, log = logger) {
  const withTransactionResponse = await withTransaction(async (client) => {
    const uuid = crypto.randomUUID();
    let hashedPassword = await hashPassword(password);
    await User.register(uuid, name, email, hashedPassword, client);
    log.info({ user_id: uuid }, "User created Successfully");
    const userObj = {
      id: uuid,
      name: name,
      role: "user",
    };
    //create a sign-up JWT token and store it in DB, which we can then verify when user verifies email.
    const signUpJwtToken = signUpToken(userObj);
    // console.log(`SIGNUP:${signUpJwtToken}`);
    // console.log("signupTokenCreated");
    let { token_id } = await storeSignUpTokenInDB(signUpJwtToken, log, client);
    log.info("Token Stored in DB");

    return token_id;
  });
  return withTransactionResponse;
}
async function new_access_token_from_refresh_token(jti, userObj, log = logger) {
  const remove = await jwt_token.deleteRefreshTokenFromDb(jti); //Removing Refresh Token from DB to avoid using this again
  if (remove.rowCount === 0) {
    log.warn("Nothing to remove from DB");
  }
  let access_token = getToken(userObj); // Generating New Access Token
  let refresh_token = refreshToken(userObj); // New Refresh Token
  log.info("Storing  new access token in DB");
  storeTokenInDB(access_token).catch((err) =>
    log.warn(`${err},"Failed to store token in DB`),
  );
  log.info("Storing new refresh token in db");
  // Await here because storing DB is important for Refresh Token
  await storeRefreshTokenInDB(refresh_token);

  return { access_token: access_token, refresh_token: refresh_token };
}

module.exports = {
  getUserByEmail,
  loginUser,
  registerUser,
  new_access_token_from_refresh_token,
};
