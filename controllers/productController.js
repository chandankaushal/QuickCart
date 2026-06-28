const { ItemNotFoundError } = require("../errors/itemErrors");
const Product = require("../models/productModel");
const {
  checkProductStock,
  getAvailableProductsByStore,
  generateProductImage,
} = require("../service/productService");
const { sendSuccess, sendError } = require("../utils/apiResponse");

async function checkProductAvailabilty(req, res) {
  let { items, location_code } = req.body;

  let result = await checkProductStock(items, location_code, req.log);

  if (result.problems) {
    throw new ItemNotFoundError();
  }
  sendSuccess(res, null, result.data, 200);
}

async function getAvailableProducts(req, res) {
  const { store_id } = req.body;
  const products = await getAvailableProductsByStore(store_id, req.log);
  sendSuccess(res, null, products, 200);
}

async function getProductImageController(req, res) {
  const { product_id } = req.params;
  const { rows } = await Product.getImageById(product_id);

  if (!rows.length) {
    sendSuccess(
      res,
      null,
      { product_id, status: "not_found", image_url: null },
      200,
    );
    return;
  }

  const row = rows[0];
  const status = row.image_url ? "ready" : row.task_id ? "pending" : "none";

  sendSuccess(
    res,
    null,
    {
      product_id: row.product_id,
      name: row.name,
      task_id: row.task_id || null,
      image_url: row.image_url || null,
      status,
    },
    200,
  );
}

async function generateImageController(req, res) {
  const { product_id } = req.params;
  const image = await generateProductImage(product_id, req.log);
  sendSuccess(res, "Image Queued, will be available once done", image, 202);
}

module.exports = {
  checkProductAvailabilty,
  getAvailableProducts,
  generateImageController,
  getProductImageController,
};
