import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as unknown as {
  mongoose: MongooseCache | undefined;
};

const cached = globalForMongoose.mongoose ?? { conn: null, promise: null };

if (!globalForMongoose.mongoose) {
  globalForMongoose.mongoose = cached;
}

function getUri(): string {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable");
  }
  return MONGODB_URI;
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = getUri();
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
