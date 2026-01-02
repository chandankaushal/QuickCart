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
  async batchUpdateProductQty(items, store_id) {
    // Batch update to avoid multiple update statements
    let preStatement = `UPDATE ${PRODUCT_TABLE} SET qty = qty - CASE upc `;
    let caseStatement = items
      .map((item, index) => `WHEN $${index * 2 + 1} THEN $${index * 2 + 2}`)
      .join(" ");
    let endStatement = ` ELSE 0 END WHERE upc = ANY($${
      items.length * 2 + 1
    }::bigint[]) AND store_id = $${
      items.length * 2 + 2
    } AND qty >= CASE upc ${caseStatement} ELSE 0 END`;
    let finalStatement = preStatement + caseStatement + endStatement; // Combining all statements to make one
    // console.log(finalStatement);

    let params = items.flatMap((item) => [item.upc, item.qty]); //UPC and qty for CASE Statements
    let upcs = items.map((item) => item.upc); // UPC for Where clause

    params.push(upcs); // Pushing upcs for where clause in params
    params.push(store_id); // pushing store_id as param
    // console.log(params);

    let queryResult = await pool.query(finalStatement, params);
    return queryResult;
  },
  async createNewProduct() {},
  async DeleteProduct() {},
};

module.exports = Product;
