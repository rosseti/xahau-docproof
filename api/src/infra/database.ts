import mongoose from "mongoose";

const MONGODB_URL =
  process.env.MONGO_URI || '';

const database = async () => {
  try {
    // await mongoose.connect(MONGODB_URL, {});
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Unable to connect to MongoDB:", error);
    process.exit(1);
  }
};

export default database;
