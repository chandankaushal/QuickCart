const express = require("express");
const router = express.Router();

const {
  checkProductAvailabilty,
  getAvailableProducts,
} = require("../controllers/productController");
const { checkValidToken } = require("../middleware/auth");
const { getAvailableProductsSchema } = require("../models/joiSchema");
const { validateBody } = require("../middleware/validate");
const wrapAsync = require("../utils/wrapAsync");

router.post("/checkAvailability", wrapAsync(checkProductAvailabilty));
router.post(
  "/available",
  validateBody(getAvailableProductsSchema),
  checkValidToken,
  wrapAsync(getAvailableProducts),
);
// router.post("/create", productController);
// router.post("/updateAvailabilty", updateAvailabilty); //just to test not needed in real app
// router.delete("/deleteProduct", productController);

module.exports = router;
