import { Db } from 'mongodb';
declare class MongoDBService {
    private client;
    private db;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    getDb(): Db;
    healthCheck(): Promise<boolean>;
}
export declare const mongoService: MongoDBService;
export {};
//# sourceMappingURL=mongodb.d.ts.map