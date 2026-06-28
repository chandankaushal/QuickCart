const express = require("express");
const router = express.Router();

const {
  checkProductAvailabilty,
  getAvailableProducts,
  generateImageController,
  getProductImageController,
} = require("../controllers/productController");
const { checkValidToken } = require("../middleware/auth");
const {
  getAvailableProductsSchema,
  imageGenerateParamSchema,
} = require("../models/joiSchema");
const { validateBody, validateParams } = require("../middleware/validate");
const wrapAsync = require("../utils/wrapAsync");

router.post("/checkAvailability", wrapAsync(checkProductAvailabilty));
router.post(
  "/available",
  validateBody(getAvailableProductsSchema),
  checkValidToken,
  wrapAsync(getAvailableProducts),
);
router.post(
  "/:product_id/image",
  validateParams(imageGenerateParamSchema),
  wrapAsync(generateImageController),
);
router.get(
  "/:product_id/image",
  validateParams(imageGenerateParamSchema),
  wrapAsync(getProductImageController),
);
// router.post("/create", productController);
// router.post("/updateAvailabilty", updateAvailabilty); //just to test not needed in real app
// router.delete("/deleteProduct", productController);

module.exports = router;
