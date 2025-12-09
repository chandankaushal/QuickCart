const joi = require("joi");
const userSchema = joi.object({
  name: joi.string().min(3).max(30).required(),
  email: joi.string().email().required(),
  password: joi.string().min(4).required(),
});

module.exports = { userSchema };
