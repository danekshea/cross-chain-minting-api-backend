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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importStar(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const config_1 = __importDefault(require("./config"));
const config_2 = require("./config");
const transportsArray = [
    new winston_1.default.transports.Console({
        format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.format.printf((info) => {
            // If info.message is an object, pretty print it. Otherwise, leave it as is.
            const message = typeof info.message === "object" ? JSON.stringify(info.message, null, 2) : info.message;
            return `[${info.timestamp}][${info.level}]${message}`;
        })),
    }),
    // ... other code
];
//If logging to file is enabled in config.ts, let's output to file, we also want to use a file per day, datePattern dictates the frequency
if (config_1.default[config_2.environment].enableFileLogging) {
    transportsArray.push(new winston_daily_rotate_file_1.default({
        filename: "logs/minting-api-backend-%DATE%.log",
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: "14d",
        format: winston_1.format.combine(winston_1.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }), winston_1.format.printf((info) => `${JSON.stringify({ timestamp: info.timestamp, level: info.level, message: info.message })}`)),
    }));
}
const logger = winston_1.default.createLogger({
    level: config_1.default[config_2.environment].logLevel,
    transports: transportsArray,
});
exports.default = logger;
