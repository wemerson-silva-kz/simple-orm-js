export type CassandraType = 
  // Basic types
  | 'uuid' | 'timeuuid' | 'text' | 'ascii' | 'varchar'
  | 'int' | 'bigint' | 'smallint' | 'tinyint' | 'varint'
  | 'float' | 'double' | 'decimal'
  | 'boolean' | 'timestamp' | 'date' | 'time' | 'duration'
  | 'blob' | 'inet' | 'counter'
  // Collection types
  | 'set<text>' | 'set<int>' | 'set<uuid>' | 'set<timestamp>'
  | 'list<text>' | 'list<int>' | 'list<uuid>' | 'list<timestamp>'
  | 'map<text,text>' | 'map<text,int>' | 'map<int,text>' | 'map<uuid,text>'
  // Tuple types
  | 'tuple<text,int>' | 'tuple<uuid,text>' | 'tuple<text,text,int>'
  // Custom types
  | 'nanoid' | 'json';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  isEmail?: boolean;
  isUrl?: boolean;
  isJson?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface FieldDefinition {
  type: CassandraType;
  validate?: ValidationRule;
  default?: any;
  unique?: boolean;
  frozen?: boolean; // For collections
}

export interface ModelSchema {
  fields: {
    [key: string]: CassandraType | FieldDefinition;
  };
  key: string[];
  clustering?: string[];
  indexes?: string[];
  unique?: string[]; // Unique constraints
  validate?: {
    [key: string]: ValidationRule;
  };
}

export interface ClientOptions {
  contactPoints: string[];
  localDataCenter: string;
  keyspace?: string;
}

export interface OrmOptions {
  createKeyspace?: boolean;
  migration?: 'safe' | 'drop';
  idGenerator?: 'uuid' | 'nanoid' | 'timeuuid';
}

export interface Config {
  clientOptions: ClientOptions;
  ormOptions?: OrmOptions;
}

export interface QueryResult {
  rows: any[];
}

export interface Model<T = any> {
  create(data: Partial<T>): Promise<T>;
  find(where?: Partial<T>): Promise<T[]>;
  findOne(where: Partial<T>): Promise<T | null>;
  update(data: Partial<T>, where: Partial<T>): Promise<void>;
  delete(where: Partial<T>): Promise<void>;
  count(where?: Partial<T>): Promise<number>;
  validate(data: any): any[];
}

// Type helpers for better DX
export type InferModelType<T extends ModelSchema> = {
  [K in keyof T['fields']]: T['fields'][K] extends CassandraType 
    ? TypeFromCassandraType<T['fields'][K]>
    : T['fields'][K] extends FieldDefinition
    ? TypeFromCassandraType<T['fields'][K]['type']>
    : any;
};

type TypeFromCassandraType<T extends CassandraType> = 
  T extends 'uuid' | 'timeuuid' | 'nanoid' ? string :
  T extends 'text' | 'ascii' | 'varchar' ? string :
  T extends 'int' | 'bigint' | 'smallint' | 'tinyint' | 'varint' | 'float' | 'double' | 'counter' ? number :
  T extends 'decimal' ? string :
  T extends 'boolean' ? boolean :
  T extends 'timestamp' | 'date' | 'time' ? Date :
  T extends 'duration' ? string :
  T extends 'blob' ? Buffer :
  T extends 'inet' ? string :
  T extends 'json' ? any :
  T extends `set<${string}>` ? any[] :
  T extends `list<${string}>` ? any[] :
  T extends `map<${string},${string}>` ? Record<string, any> :
  T extends `tuple<${string}>` ? any[] :
  any;
