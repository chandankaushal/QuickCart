// server.js
require("dotenv").config();
const express = require("express");
const userRoutes = require("./routes/userRoutes.js");
const monitoringRoutes = require("./routes/monitoringRoutes.js");
const storeRoutes = require("./routes/storeRoutes");
const serviceOptionsRoutes = require("./routes/serviceOptionsRoutes");

const app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

app.use("/users", userRoutes);
app.use("/monitoring", monitoringRoutes);
app.use("/stores", storeRoutes);
app.use("/service_options", serviceOptionsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
