import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config({
    path: ".env"
})
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in env");
}

// Global cache 
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      dbName : process.env.DBNAME
    }).then((mongoose) => {
      console.log("MongoDB Connected");
      return mongoose
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;


