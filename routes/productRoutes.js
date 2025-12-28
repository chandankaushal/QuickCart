const express = require("express");
const router = express.Router();

const { checkProductAvailabilty } = require("../controllers/productController");

router.post("/checkAvailability", checkProductAvailabilty);
// router.post("/create", productController);
// router.post("/updateAvailabilty", updateAvailabilty); //just to test not needed in real app
// router.delete("/deleteProduct", productController);

module.exports = router;
