import express from "express";
import dotenv from "dotenv";
import authRoutes from "./auth/auth.routes.js";

dotenv.config();

const PORT = process.env.PORT;
const app = express();

app.use("/api/v1/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`${PORT}`);
});
