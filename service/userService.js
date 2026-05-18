const { validateEmail } = require("../utils/validEmail");
const User = require("../models/userModel");
const jwt_token = require("../models/jwtTokenModel");
const {
  ExpressError,
  UnauthorizedError,
  InternalServerError,
  CannotLoginError,
} = require("../utils/ExpressError");
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
const {
  SIGNUP_EMAIL_SUBJECT,
  buildSignupEmailBody,
} = require("../utils/emailTemplates");
const sendToQueue = require("../queues/sendToQueue");
const {
  NoUserExistsError,
  UserNotActiveError,
  InvalidVerificationTokenError,
  InvalidEmailError,
  CannotViewUserError,
  CannotUpdateUserError,
} = require("../errors/userErrors");
const isAdmin = require("../utils/isadmin");
const isSameUser = require("../utils/sameUser");

async function getUserByEmail(email, user_id, log = logger) {
  if (!user_id) {
    throw new NoUserExistsError();
  }
  console.log(user_id);
  log.info({ email }, "Validating Email");
  let isValid = validateEmail(email);

  if (isValid) {
    let response = await User.getByEmail(email);
    if (response.rowCount >= 1) {
      if (user_id != response.rows[0].id) {
        throw new CannotViewUserError();
      }
      log.info(`Found User`, response.rows[0].id);
      return response;
    } else {
      throw new NoUserExistsError();
    }
  } else {
    throw new InvalidEmailError();
  }
}

async function loginUser(email, password, log = logger) {
  log.info("Getting User by Email");
  const response = await User.getPasswordByEmail(email);
  if (response.rowCount === 0) {
    throw new NoUserExistsError();
  }
  log.info("Comparing Passwords");
  let result = await comparePassword(password, response.rows[0].password);
  if (result) {
    const { rows: isActive } = await User.isUserActive(email);
    if (!isActive[0].verified) {
      log.warn("User is not active");
      throw new UserNotActiveError();
    }
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
    throw new CannotLoginError();
  }
}

async function registerUser(name, email, password, log = logger) {
  const withTransactionResponse = await withTransaction(async (client) => {
    const uuid = crypto.randomUUID();
    let hashedPassword = await hashPassword(password);
    await User.register(uuid, name, email, hashedPassword, client);
    log.info({ user_id: uuid }, "User created in the DB");
    const userObj = {
      id: uuid,
      name: name,
      role: "user",
    };
    //create a sign-up JWT token and store it in DB, which we can then verify when user verifies email.
    const signUpJwtToken = signUpToken(userObj);

    log.info("SignUp Token created");
    let { token_id } = await storeSignUpTokenInDB(signUpJwtToken, log, client);
    log.info("Signup Token Stored in DB");
    // Adding a job to send email to the Email SQS queue.
    await sendToQueue(
      {
        type: "SIGNUP_USER",
        userId: uuid,
        email: process.env.TO_EMAIL || email,
        subject: SIGNUP_EMAIL_SUBJECT,
        body: buildSignupEmailBody(token_id),
      },
      "SIGNUP_EMAIL",
    );
    log.info(
      { user_id: userObj.id, email: email },
      "Adding Signup Email job to the SQS queue",
    );

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
async function email_verify_token(token_id, log = logger) {
  let withTransactionResponse = await withTransaction(async (client) => {
    const { rows: token } = await jwt_token.getSignupTokenFromDB(token_id);

    if (token.length === 0) {
      log.warn(`${token_id} is incorrect or does not exist in the DB`);
      throw new InvalidVerificationTokenError();
    }

    await User.verifyUser(token[0].user_id, client);
    log.info({ user_id: token[0].user_id }, "User Verified");
    await jwt_token.deleteSignupTokenFromDb(token_id, client);
    log.info("Signup Token deleted");
    return true;
  });
  return withTransactionResponse;
}
async function update_user(userInParams, updatedUserData, tokenUser, log) {
  const withTransactionResponse = await withTransaction(async (client) => {
    const response = await User.getById(userInParams, client);
    if (dbReturnedRows(response)) {
      let userToUpdate = response.rows[0];
      if (
        isAdmin(tokenUser.role) ||
        isSameUser(tokenUser.id, userToUpdate.id)
      ) {
        if (updatedUserData.password) {
          updatedUserData.password = await hashPassword(
            updatedUserData.password,
          );
        }
        let result = await User.updateUser(
          userToUpdate.id,
          updatedUserData,
          client,
        );
        if (!result || result.rowCount === 0) {
          log.error("User Not Updated");
          throw new InternalServerError();
        }

        return result.rows[0];
      } else {
        throw new CannotUpdateUserError();
      }
    }
    throw new NoUserExistsError();
  });
  return withTransactionResponse;
}

async function loginAgentByUserPhone(phoneNumber, agentInfo, log) {
  //Lookup If Valid Agent
  //Lookup User by Phone
  const response = await User.getByEmail(phoneNumber); // We can change this later
  if (dbReturnedRows(response)) {
    //Get user token
    let userObj = {
      id: response.rows[0].id,
      email: response.rows[0].email,
      role: response.rows[0].role,
    };
    const userToken = getToken(userObj);
    //give that token to agent
    return userToken;
    // To-DO verify if the user is the authorized
  } else {
    throw new NoUserExistsError();
  }
}
module.exports = {
  getUserByEmail,
  loginUser,
  registerUser,
  new_access_token_from_refresh_token,
  email_verify_token,
  update_user,
  loginAgentByUserPhone,
};
function dbReturnedRows(response) {
  if (response.rowCount > 0) {
    return true;
  }
  return false;
}
