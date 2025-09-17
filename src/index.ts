export { CassandraORM } from './client';
export { TypeConverter } from './converter';
export { Validator } from './validator';
export * from './types';
export * from './errors';

// Convenience function
import { CassandraORM } from './client';
import { Config } from './types';

export function createClient(config: Config) {
  return new CassandraORM(config);
}

// ID utilities
export { types as CassandraTypes } from 'cassandra-driver';
export { nanoid } from 'nanoid';
export const uuid = () => require('cassandra-driver').types.Uuid.random();
