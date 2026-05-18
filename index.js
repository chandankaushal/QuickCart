// server.js
require("dd-trace").init({
  service: "quickcart", // service name
  env: "dev", // environment
  logInjection: true, // puts trace IDs into logs
  runtimeMetrics: true, // optional, extra metrics
});
require("dotenv").config();
const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const userRoutes = require("./routes/userRoutes.js");
const monitoringRoutes = require("./routes/monitoringRoutes.js");
const storeRoutes = require("./routes/storeRoutes");
const serviceOptionsRoutes = require("./routes/serviceOptionsRoutes");
const productRoutes = require("./routes/productRoutes.js");
const orderRoutes = require("./routes/orderRoutes.js");
const mcpRoutes = require("./routes/mcpRoutes.js");
const errorHandler = require("./middleware/error.js");
const logger = require("./utils/logger");
const pinoMiddleware = require("./middleware/pinoLogger.js");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const limiter = require("./utils/rate-limit.js");

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(pinoMiddleware);
app.use(cookieParser());
app.use(limiter);

// Serve the raw OpenAPI spec so Swagger UI can load it
app.get("/openapi.yaml", (req, res) => {
  res.sendFile(path.join(__dirname, "openapi.yaml"));
});

// Swagger UI at /api-docs using the existing OpenAPI YAML
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: {
      url: "/openapi.yaml",
    },
  }),
);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running ✅" });
});

app.use("/users", userRoutes);
app.use("/monitoring", monitoringRoutes);
app.use("/stores", storeRoutes);
app.use("/service_options", serviceOptionsRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/mcp", mcpRoutes);

if (process.env.CLIENT_DIST_PATH) {
  const clientDist = path.resolve(process.env.CLIENT_DIST_PATH);
  app.use(express.static(clientDist));
  app.get(
    /^(?!\/users|\/stores|\/products|\/service_options|\/orders|\/monitoring|\/mcp|\/api-docs|\/openapi\.yaml).*/,
    (req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    },
  );
}

const PORT = process.env.PORT || 3000;

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
