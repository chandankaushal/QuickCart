const ORDER_EVENT_TYPES = {
  created: "ORDER_CREATED",
  ORDER_UPDATED: "ORDER_UPDATED",
};

const ORDER_STATES = [
  "brand_new",
  "acknowledged",
  "picking",
  "ready_for_pickup",
  "delivered",
];

module.exports = { ORDER_STATES, ORDER_EVENT_TYPES };
