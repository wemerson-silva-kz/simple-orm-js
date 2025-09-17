export { CassandraORM } from './client';
export { TypeConverter } from './converter';
export { Validator } from './validator';
export * from './types';
export * from './errors';
import { CassandraORM } from './client';
import { Config } from './types';
export declare function createClient(config: Config): CassandraORM;
export { types as CassandraTypes } from 'cassandra-driver';
export { nanoid } from 'nanoid';
export declare const uuid: () => any;
//# sourceMappingURL=index.d.ts.map