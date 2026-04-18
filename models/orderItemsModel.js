const ORDER_ITEMS_TABLE_NAME = `quickcart.order_items`;
const crypto = require("crypto");
const Product = require("../models/productModel");
const pool = require("../db");

const OrderItems = {
  async addItems(information, client = null) {
    //Extract Info from params
    const { order_id, items, location_code } = information;

    //get the upcs
    let upcs = items.map((item) => item.upc);
    //Lookup product id for this upc
    let response = await Product.getIdByUpc(upcs, location_code);

    let upcToId = {};
    let upcToUnitPrice = {};
    response.rows.forEach((row) => {
      upcToId[row.upc] = row.product_id;
    });

    response.rows.forEach((row) => {
      upcToUnitPrice[row.upc] = parseInt(row.price_cents);
    });

    // Adding order_items to Order Items table

    //Build first half of insert
    let preStatement = `INSERT INTO ${ORDER_ITEMS_TABLE_NAME}(id,order_id,product_id,quantity,unit_price, upc) VALUES`;
    // Build placeholders
    let placeholders = items
      .map((item, index) => {
        let base = index * 6;
        return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6})`;
      })
      .join(",");
    let sql = preStatement + placeholders;
    // build params
    let params = [];
    items.forEach((item) => {
      params.push(crypto.randomUUID());
      params.push(order_id);
      params.push(upcToId[item.upc]);
      params.push(item.qty);
      params.push(upcToUnitPrice[item.upc]);
      params.push(item.upc);
    });
    console.log(sql);
    console.log(params);
    // if (client) {
    //   const queryResult = await client.query(sql, params);
    //   return queryResult;
    // }
    // const queryResult = await pool.query(sql, params);
    // return queryResult;
  },
  async getAllAboutItems(order_id) {
    let sql = `SELECT * from ${ORDER_ITEMS_TABLE_NAME} WHERE order_id = $1`;
    let params = [order_id];

    let { rows: items } = await pool.query(sql, params);

    return items;
  },
  async getItems(order_id) {
    let sql = `SELECT product_id, quantity from ${ORDER_ITEMS_TABLE_NAME} WHERE order_id = $1`;
    let params = [order_id];

    let { rows: items } = await pool.query(sql, params);

    return items;
  },
  async deleteOrder(order_id, client) {
    let sql = `DELETE FROM ${ORDER_ITEMS_TABLE_NAME} WHERE order_id = $1`;
    let params = [order_id];
    if (client) {
      let response = await client.query(sql, params);

      return response;
    }
    let response = await pool.query(sql, params);

    return response;
  },
  async getSpecificItemsForOrder(item_id, order_id, client = null) {
    const idsArray = Array.isArray(item_id) ? item_id : [item_id];
    const ids = idsArray.map((id) => Number(id));

    let sql = `SELECT * FROM ${ORDER_ITEMS_TABLE_NAME} WHERE product_id = ANY($1::bigint[]) AND order_id = $2`;
    const values = [ids, order_id];

    const runner = client || pool;
    const response = await runner.query(sql, values);
    return response.rows;
  },
  async deleteSpecificItemsForOrder(item_id, order_id, client = null) {
    const idsArray = Array.isArray(item_id) ? item_id : [item_id];
    const ids = idsArray.map((id) => Number(id));

    const sql = `
    DELETE FROM ${ORDER_ITEMS_TABLE_NAME}
    WHERE order_id = $1
      AND product_id = ANY($2::bigint[])
  `;
    const values = [order_id, ids];

    const runner = client || pool;
    const response = await runner.query(sql, values);
    return response;
  },
};

(async () => {
  let information = {
    order_id: "1234",
    items: [
      {
        upc: 222333444555,
        qty: 2,
      },
      {
        upc: 333444555666,
        qty: 4,
      },
    ],
    location_code: 2,
  };
  await OrderItems.addItems(information);
})();

module.exports = OrderItems;
