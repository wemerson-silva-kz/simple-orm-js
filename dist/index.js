"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuid = exports.nanoid = exports.CassandraTypes = exports.Validator = exports.TypeConverter = exports.CassandraORM = void 0;
exports.createClient = createClient;
var client_1 = require("./client");
Object.defineProperty(exports, "CassandraORM", { enumerable: true, get: function () { return client_1.CassandraORM; } });
var converter_1 = require("./converter");
Object.defineProperty(exports, "TypeConverter", { enumerable: true, get: function () { return converter_1.TypeConverter; } });
var validator_1 = require("./validator");
Object.defineProperty(exports, "Validator", { enumerable: true, get: function () { return validator_1.Validator; } });
__exportStar(require("./types"), exports);
__exportStar(require("./errors"), exports);
const client_2 = require("./client");
function createClient(config) {
    return new client_2.CassandraORM(config);
}
var cassandra_driver_1 = require("cassandra-driver");
Object.defineProperty(exports, "CassandraTypes", { enumerable: true, get: function () { return cassandra_driver_1.types; } });
var nanoid_1 = require("nanoid");
Object.defineProperty(exports, "nanoid", { enumerable: true, get: function () { return nanoid_1.nanoid; } });
const uuid = () => require('cassandra-driver').types.Uuid.random();
exports.uuid = uuid;
//# sourceMappingURL=index.js.map