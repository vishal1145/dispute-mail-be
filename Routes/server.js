import mongoose from "mongoose";
import dotenv from "dotenv";


dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ Error connecting to DB:", err.message);
    process.exit(1);
  }
};



export default connectDB;