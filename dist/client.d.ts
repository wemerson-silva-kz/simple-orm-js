import { Config, ModelSchema, Model } from './types';
export declare class CassandraORM {
    private config;
    private client;
    private keyspace;
    private connected;
    private models;
    constructor(config: Config);
    connect(): Promise<void>;
    executeWithPrepared(query: string, values?: any[]): Promise<any>;
    loadSchema<T extends ModelSchema>(tableName: string, schema: T): Promise<Model<any>>;
    disconnect(): Promise<void>;
    private createKeyspaceWithClient;
    private createTable;
    private getUniqueFieldsFromSchema;
    private getFieldType;
}
//# sourceMappingURL=client.d.ts.map