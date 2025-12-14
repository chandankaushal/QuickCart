const express = require("express");
const router = express.Router();

const { checkProductAvailabilty } = require("../controllers/productController");

router.post("/checkAvailability", checkProductAvailabilty);
// router.post("/create", productController);
// router.patch("/updateAvailabilty", productController);
// router.delete("/deleteProduct", productController);

module.exports = router;
