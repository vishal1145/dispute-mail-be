import express from "express";
import userRoutes from "./Routes/user.js";
import connectDB from "./Routes/server.js"; // renamed to db.js
import cors from "cors";
// import ExcelUpload from "./Routes/uploadExcel.js"

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount with leading slash
app.use("/api/users", userRoutes);

// (optional) health check
app.get("/health", (_req, res) => res.send("ok"));

// 404 handler (optional)
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Connect to MongoDB


connectDB();

// Start server
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`Server running on port: http://localhost:${PORT}`)
);
