import { MongoClient, Db } from 'mongodb';

class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.warn('MongoDB URI not configured. Database features will be disabled.');
      return;
    }

    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      
      const dbName = process.env.MONGODB_DB_NAME || 'payguard';
      this.db = this.client.db(dbName);
      
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  isConnected(): boolean {
    return this.db !== null;
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Please set MONGODB_URI in environment variables and call connect() first.');
    }
    return this.db;
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) {
        return false;
      }
      await this.db.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const mongoService = new MongoDBService();

