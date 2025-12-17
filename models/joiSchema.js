const Joi = require("joi");
const userSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(4).required(),
});
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(4).required(),
});

const getUserSchema = Joi.object({
  email: Joi.string().email().required(),
});

const storeSchema = Joi.object({
  STORE_ID: Joi.number().integer().min(1).required(),

  NAME: Joi.string().min(1).required(),

  RETAILER: Joi.string().min(1).required(),

  CITY: Joi.string().min(1).required(),

  STATE: Joi.string().min(2).max(2).required(), // CA, NY, TX, etc.

  zip_code: Joi.string()
    .pattern(/^\d{5}(-\d{4})?$/)
    .required(),

  STREET: Joi.string().min(1).required(),
});

module.exports = { userSchema, storeSchema, getUserSchema, loginSchema };
