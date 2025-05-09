import mongoose from "mongoose";

export const connDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};
