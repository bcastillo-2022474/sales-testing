import express from "express";
import dotenv from "dotenv";
import authRoutes from "./auth/auth.routes.js";
import morgan from "morgan";
import { dbConnection } from "./db/db-connection.js";
import productRoutes from "./products/product.routes.js";

dotenv.config();

const PORT = process.env.PORT;
const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});
dbConnection().then(() => {
  console.log("Database connected");
  app.listen(PORT, () => {
    console.log(`${PORT}`);
  });
});
