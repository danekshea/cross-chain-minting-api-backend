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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnActivePhase = exports.readAddressesFromCSV = exports.verifySNSSignature = exports.decodePassportToken = exports.verifyPassportToken = void 0;
const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const axios = require("axios");
const util_1 = require("util");
const config_1 = __importStar(require("./config"));
const SnsValidator = require("sns-validator");
const validator = new SnsValidator();
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("./logger"));
// Function to verify the JWT token
function verifyPassportToken(IDtoken, jwk) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pem = jwkToPem(jwk);
            const verifyPromise = (0, util_1.promisify)(jwt.verify);
            try {
                const decoded = yield verifyPromise(IDtoken, pem, { algorithms: ["RS256"] });
                // Stringify the decoded token to log the details properly
                logger_1.default.info(`JWT verified: ${JSON.stringify(decoded, null, 2)}`);
            }
            catch (err) {
                // Stringify the error to display all its properties
                logger_1.default.error(`JWT verification failed: ${JSON.stringify(err, null, 2)}`);
                throw err;
            }
        }
        catch (error) {
            // Stringify the error to display all its properties
            logger_1.default.error(`Error during token verification: ${JSON.stringify(error, null, 2)}`);
            throw error;
        }
    });
}
exports.verifyPassportToken = verifyPassportToken;
// Function to decode the JWT token
function decodePassportToken(IDtoken) {
    return __awaiter(this, void 0, void 0, function* () {
        const decoded = jwt.decode(IDtoken, { complete: true });
        // Ensure the decoded data is logged as a stringified object for clarity
        logger_1.default.debug(`Decoded JWT: ${JSON.stringify(decoded, null, 2)}`);
        return decoded;
    });
}
exports.decodePassportToken = decodePassportToken;
// Function to verify the SNS signature
function verifySNSSignature(webhookPayload) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            validator.validate(webhookPayload, (err) => {
                if (err) {
                    // Log the error as a stringified object to capture details
                    logger_1.default.error(`Signature validation failed: ${JSON.stringify(err, null, 2)}`);
                    reject(false);
                }
                else {
                    logger_1.default.info("Signature verification successful");
                    resolve(true);
                }
            });
        });
    });
}
exports.verifySNSSignature = verifySNSSignature;
function readAddressesFromCSV(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = fs_1.default.readFileSync(filePath, { encoding: "utf-8" });
            // Split the data into lines
            const lines = data.split("\n");
            // Skip the first line (header) and process the rest
            return lines
                .slice(1)
                .filter((line) => line.length > 0)
                .map((line) => {
                const [address, signature] = line.split(",");
                return { address, signature };
            });
        }
        catch (error) {
            console.error("Error reading file:", error);
            return [];
        }
    });
}
exports.readAddressesFromCSV = readAddressesFromCSV;
function returnActivePhase() {
    const currentTime = Math.floor(Date.now() / 1000); // current time in seconds
    const phases = config_1.default[config_1.environment].mintPhases;
    for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        if (currentTime >= phase.startTime && currentTime <= phase.endTime) {
            return i;
        }
    }
    return null;
}
exports.returnActivePhase = returnActivePhase;
// export function checkConfigValidity(config) {
//   const { mintPhases, maxTokenSupplyAcrossAllPhases } = config;
//   const currentTime = Math.floor(Date.now() / 1000); // current time in seconds
//   let totalTokens = 0;
//   let lastEndTime = 0;
//   let tokenRanges = [];
//   for (let i = 0; i < mintPhases.length; i++) {
//     const phase = mintPhases[i];
//     // Check if phase is currently active or has passed
//     if (currentTime >= phase.startTime && currentTime <= phase.endTime) {
//       logger.warn(`Phase "${phase.name}" is currently active.`);
//     } else if (currentTime > phase.endTime) {
//       logger.warn(`Phase "${phase.name}" has already ended.`);
//     }
//     // Existing checks...
//     if (phase.enableTokenIDRollOver) {
//       // Conditions for TokenIDRollOver...
//     } else {
//       // Conditions for standard token ID management...
//       for (const range of tokenRanges) {
//         // Check for token ID range overlaps...
//       }
//       tokenRanges.push({ startTokenID: phase.startTokenID, endTokenID: phase.endTokenID });
//       totalTokens += phase.endTokenID - phase.startTokenID + 1;
//     }
//     // Check for overlapping phase times...
//     if (phase.startTime <= lastEndTime) {
//       logger.error(`Phase time overlap detected between phases ending at ${lastEndTime} and starting at ${phase.startTime}`);
//       return false;
//     }
//     lastEndTime = phase.endTime;
//     // Check for maxTokensPerWallet when allowlist is enabled...
//   }
//   // Check if maxTokenSupplyAcrossAllPhases is exceeded...
//   if (maxTokenSupplyAcrossAllPhases !== undefined && totalTokens > maxTokenSupplyAcrossAllPhases) {
//     logger.error(`Total token supply across all phases (${totalTokens}) exceeds the configured maximum (${maxTokenSupplyAcrossAllPhases}).`);
//     return false;
//   }
//   logger.info("All config checks passed.");
//   return true;
// }
