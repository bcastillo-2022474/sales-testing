import express from "express";
import dotenv from "dotenv";
import authRoutes from "./auth/auth.routes.js";
import morgan from "morgan";
import { dbConnection } from "./db/db-connection.js";

dotenv.config();

const PORT = process.env.PORT;
const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use("/api/auth", authRoutes);

dbConnection().then(() => {
  console.log("Database connected");
  app.listen(PORT, () => {
    console.log(`${PORT}`);
  });
});
