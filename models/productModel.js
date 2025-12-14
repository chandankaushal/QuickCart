const pool = require("../db");

const PRODUCT_TABLE = `"quickcart".products`;

const Product = {
  async getProductByUpc(upc, store_id) {
    const upcArray = Array.isArray(upc) ? upc : [upc]; // if we get single upc then we pass as [upc]

    let sql = `SELECT upc,qty FROM ${PRODUCT_TABLE} WHERE upc = ANY($1::bigint[]) AND store_id = $2`; // Using IN to lookup mutiple products at once
    let values = [upcArray, store_id];

    const result = await pool.query(sql, values);

    return result;
  },
  async updateProductAvailability() {},
  async createNewProduct() {},
  async DeleteProduct() {},
};

module.exports = Product;
