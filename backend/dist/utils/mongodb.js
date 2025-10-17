"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoService = void 0;
const mongodb_1 = require("mongodb");
class MongoDBService {
    client = null;
    db = null;
    async connect() {
        if (this.client) {
            return;
        }
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.warn('MongoDB URI not configured. Database features will be disabled.');
            return;
        }
        try {
            this.client = new mongodb_1.MongoClient(uri);
            await this.client.connect();
            const dbName = process.env.MONGODB_DB_NAME || 'payguard';
            this.db = this.client.db(dbName);
            console.log('Connected to MongoDB');
        }
        catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }
    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
        }
    }
    isConnected() {
        return this.db !== null;
    }
    getDb() {
        if (!this.db) {
            throw new Error('Database not connected. Please set MONGODB_URI in environment variables and call connect() first.');
        }
        return this.db;
    }
    async healthCheck() {
        try {
            if (!this.db) {
                return false;
            }
            await this.db.admin().ping();
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.mongoService = new MongoDBService();
//# sourceMappingURL=mongodb.js.map