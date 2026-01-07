// server.js
require("dd-trace").init({
  service: "quickcart", // or any name you want to see in APM
  env: "dev", // dev / staging / prod
  logInjection: true, // puts trace IDs into logs
  runtimeMetrics: true, // optional, extra metrics
});
require("dotenv").config();
const express = require("express");
const userRoutes = require("./routes/userRoutes.js");
const monitoringRoutes = require("./routes/monitoringRoutes.js");
const storeRoutes = require("./routes/storeRoutes");
const serviceOptionsRoutes = require("./routes/serviceOptionsRoutes");
const productRoutes = require("./routes/productRoutes.js");
const orderRoutes = require("./routes/orderRoutes.js");
const errorHandler = require("./middleware/error.js");
const logger = require("./utils/logger");
const pinoMiddleware = require("./middleware/pinoLogger.js");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(pinoMiddleware);
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running ✅" });
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
});
