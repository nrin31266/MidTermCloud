const { MongoClient } = require('mongodb');

const DB_NAME = process.env.DB_NAME || 'DB_23IT231';

const readClient = new MongoClient(process.env.READ_MONGO_URI);
const writeClient = new MongoClient(process.env.WRITE_MONGO_URI);

const readDb = readClient.db(DB_NAME);
const writeDb = writeClient.db(DB_NAME);

async function connectDB() {
  await Promise.all([readClient.connect(), writeClient.connect()]);
  console.log(`Connected to MongoDB Atlas (${DB_NAME})`);
}

module.exports = {
  readClient,
  writeClient,
  readDb,
  writeDb,
  connectDB
};
