import mongoose from 'mongoose';

let mongod = null;

export const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI;

    // If no URI or in-memory requested, attempt to start in-memory server
    if (!mongoURI || mongoURI === 'in-memory') {
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongod = await MongoMemoryServer.create();
        mongoURI = mongod.getUri();
        console.log(`📦 Dynamic In-Memory MongoDB Server initialized: ${mongoURI}`);
      } catch (err) {
        mongoURI = 'mongodb://localhost:27017/secure_backend';
      }
    }

    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // If not production, throw error so caller can catch or exit
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  } catch (err) {
    console.error('Error during DB disconnection:', err.message);
  }
};
