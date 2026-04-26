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
    let response = await Product.getIdByUpc(upcs, location_code, client);

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
    let preStatement = `INSERT INTO ${ORDER_ITEMS_TABLE_NAME}(id,order_id,product_id,quantity,unit_price, upc) VALUES`; // I think we can remove the product_id and save DB call here.
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
    const runner = client || pool;
    const queryResult = await runner.query(sql, params);
    return queryResult;
  },
  async getAllAboutItems(order_id) {
    let sql = `SELECT * from ${ORDER_ITEMS_TABLE_NAME} WHERE order_id = $1`;
    let params = [order_id];

    let { rows: items } = await pool.query(sql, params);

    return items;
  },
  async getItems(order_id, client = null) {
    let sql = `SELECT product_id, quantity from ${ORDER_ITEMS_TABLE_NAME} WHERE order_id = $1`;
    let params = [order_id];
    let runner = client || pool;
    let { rows: items } = await runner.query(sql, params);

    return items;
  },
  async deleteOrder(order_id, client = null) {
    let sql = `DELETE FROM ${ORDER_ITEMS_TABLE_NAME} WHERE order_id = $1`;
    let params = [order_id];
    const runner = client || pool;
    let response = await runner.query(sql, params);

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
  async getItemsUpc(order_id, client = null) {
    const sql = `SELET * FROM ${ORDER_ITEMS_TABLE_NAME} WHERE order_id = $1;`;
    const params = [order_id];

    const runner = client || pool;

    return await runner.query(sql, params);
  },
};
module.exports = OrderItems;
