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

const orderSchema = Joi.object({
  order_id: Joi.string().uuid().required(),
  items: Joi.array()
    .items(
      Joi.object({
        upc: Joi.number().integer().required(),
        qty: Joi.number().integer().min(1).required(),
      }),
    )
    .min(1)
    .required(),
  location_code: Joi.number().integer().required(),
  service_option_hold_id: Joi.number().integer().required(),
  needsWebhook: Joi.boolean().optional(),
});

const getServiceOptionSchema = Joi.object({
  store_id: Joi.number().integer().required(),
});
const getOrderSchema = Joi.object({
  order_id: Joi.string().uuid().required(),
});
const reserveServiceOptionSchema = Joi.object({
  service_option_id: Joi.number().integer().required(),
});
const getStoreSchema = Joi.object({
  zip_code: Joi.string()
    .pattern(/^\d{5}(-\d{4})?$/)
    .required()
    .messages({
      "string.pattern.base": "Zip code must be in ##### or #####-#### format.",
    }),
  street: Joi.string().optional(),
});
const cancelOrderSchema = Joi.object({
  order_id: Joi.string().uuid().required(),
  needsWebhook: Joi.boolean().optional().default(false),
});
const transitionOrderSchema = Joi.object({
  order_id: Joi.string().uuid().required(),
  state: Joi.string()
    .trim()
    .lowercase()
    .custom((value, helpers) => {
      if (value === "cancelled") {
        return helpers.error("state.cancelled");
      }
      return value;
    }, "cancelled route guidance")
    .valid(
      "brand_new",
      "acknowledged",
      "picking",
      "ready_for_pickup",
      "delivered",
    )
    .messages({
      "state.cancelled": "For cancelled state, use /orders/cancel endpoint.",
      "any.only":
        "Invalid state. Allowed: brand_new, acknowledged, picking, ready_for_pickup, delivered.",
    })
    .optional(),
});
const updateOrderSchema = Joi.object({
  order_id: Joi.string().uuid().required(),
  items: Joi.array()
    .items(
      Joi.object({
        upc: Joi.number().integer().required(),
        qty: Joi.number().integer().min(1).required(),
      }),
    )
    .min(1)
    .required(),
  service_option_hold_id: Joi.number().integer().required(),
});
module.exports = {
  userSchema,
  storeSchema,
  getUserSchema,
  loginSchema,
  orderSchema,
  getServiceOptionSchema,
  reserveServiceOptionSchema,
  getStoreSchema,
  cancelOrderSchema,
  transitionOrderSchema,
  getOrderSchema,
  updateOrderSchema,
};
