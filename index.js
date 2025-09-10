import express from "express";
import userRoutes from "./routes/user.js";
import connectDB from "./routes/server.js"; // renamed to db.js
import cors from "cors";
// import ExcelUpload from "./Routes/uploadExcel.js"

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/users/api", userRoutes);
// app.use("/users/api", ExcelUpload);

// Connect to MongoDB
connectDB();

// Start server
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`Server running on port: http://localhost:${PORT}`)
);
