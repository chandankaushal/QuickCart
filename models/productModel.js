const pool = require("../db");

const PRODUCT_TABLE = `"quickcart".products`;

const Product = {
  async getProductByUpc(upc, store_id, client = null) {
    const upcArray = Array.isArray(upc) ? upc : [upc]; // if we get single upc then we pass as [upc]

    let sql = `SELECT upc,qty FROM ${PRODUCT_TABLE} WHERE upc = ANY($1::bigint[]) AND store_id = $2`; //  lookup mutiple products at once
    let values = [upcArray, store_id];
    let runner = client || pool;
    const result = await runner.query(sql, values);

    return result;
  },
  async getIdByUpc(upc, store_id, client = null) {
    const upcArray = Array.isArray(upc) ? upc : [upc]; // if we get single upc then we pass as [upc]
    let sql = `SELECT product_id,qty,price_cents,upc FROM ${PRODUCT_TABLE} WHERE upc = ANY($1::bigint[]) AND store_id = $2`; //lookup mutiple products at once
    let values = [upcArray, store_id];
    const runner = client || pool;
    const result = await runner.query(sql, values);

    return result;
  },
  async batchUpdateProductQty(items, store_id, client = null) {
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

    let params = items.flatMap((item) => [item.upc, item.qty]); //UPC and qty for CASE Statements
    let upcs = items.map((item) => item.upc); // UPC for Where clause

    params.push(upcs); // Pushing upcs for where clause in params
    params.push(store_id); // pushing store_id as param
    const runner = client || pool;
    return await runner.query(finalStatement, params);
  },
  async createNewProduct() {},
  async DeleteProduct() {},
  async getPriceByUpc(upc, store_id, client = null) {
    const upcArray = Array.isArray(upc) ? upc : [upc]; // if we get single upc then we pass as [upc]
    let sql = `SELECT upc,price_cents FROM ${PRODUCT_TABLE} WHERE upc = ANY($1::bigint[]) AND store_id = $2`; // Using IN to lookup mutiple products at once
    let values = [upcArray, store_id];
    let runner = client || pool;
    const result = await runner.query(sql, values);
    return result;
  },
  async addProducts(items, client = null) {
    let preStatement = `UPDATE ${PRODUCT_TABLE} SET qty = qty + CASE product_id `;
    let caseStatement = items
      .map(
        (item, index) =>
          `WHEN $${index * 2 + 1}::bigint THEN $${index * 2 + 2}::integer`,
      )
      .join(" ");
    let endStatement = ` END WHERE product_id = ANY($${
      items.length * 2 + 1
    }::bigint[])`;
    let finalStatement = preStatement + caseStatement + endStatement; // Combining all statements to make one

    let params = items.flatMap((item) => [
      Number(item.product_id),
      Number(item.quantity),
    ]); //Product_id and qty for CASE Statements
    let product_ids = items.map((item) => Number(item.product_id)); // UPC for Where clause
    params.push(product_ids); // Pushing upcs for where clause in params
    const runner = client || pool;
    return await runner.query(finalStatement, params);
  },
};

module.exports = Product;
