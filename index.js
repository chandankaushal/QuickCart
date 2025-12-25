// server.js
require("dotenv").config();
const express = require("express");
const userRoutes = require("./routes/userRoutes.js");
const monitoringRoutes = require("./routes/monitoringRoutes.js");
const storeRoutes = require("./routes/storeRoutes");
const serviceOptionsRoutes = require("./routes/serviceOptionsRoutes");
const productRoutes = require("./routes/productRoutes.js");
const orderRoutes = require("./routes/orderRoutes.js");
const errorHandler = require("./middleware/error.js");
const pinoHttp = require("pino-http");
const logger = require("./utils/logger");
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers["x-request-id"] || crypto.randomUUID(),

    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },

    customSuccessMessage: (req, res) =>
      `${req.method} ${req.url} ${res.statusCode}`,
  })
);

app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

app.use("/users", userRoutes);
app.use("/monitoring", monitoringRoutes);
app.use("/stores", storeRoutes);
app.use("/service_options", serviceOptionsRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);

const PORT = process.env.PORT || 3000;

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  // console.log(`Server running on port ${PORT}`);
});
