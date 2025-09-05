const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Set up before all tests
beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
});

// Clean up after each test
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for ( const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
});

// Clean up after all tests
afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
});