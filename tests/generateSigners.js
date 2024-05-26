"use strict";
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
const ethers_1 = require("ethers");
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../src/config"));
const config_2 = require("../src/config");
// Asynchronously generates signers and signs messages
function generateAndSign(signerCount, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const signers = [];
        for (let i = 0; i < signerCount; i++) {
            const wallet = ethers_1.ethers.Wallet.createRandom();
            const signature = yield wallet.signMessage(message);
            signers.push({
                address: wallet.address,
                signature: signature,
            });
        }
        return signers;
    });
}
// Converts an array of Signer objects to CSV format
function convertToCSV(signers) {
    const header = "address,signature";
    const rows = signers.map((signer) => `${signer.address},${signer.signature}`);
    rows.unshift(header);
    return rows.join("\r\n");
}
// Main function executing the generate, convert and save functionalities
function main(signerCount) {
    return __awaiter(this, void 0, void 0, function* () {
        const signers = yield generateAndSign(signerCount, config_1.default[config_2.environment].eoaMintMessage);
        const csvData = convertToCSV(signers);
        const outputFilePath = "tests/signers.csv";
        fs_1.default.writeFile(outputFilePath, csvData, (err) => {
            if (err) {
                console.error("Error writing file:", err);
                return;
            }
            console.log("EOAs and Signatures saved to:", outputFilePath);
        });
    });
}
main(3000).catch(console.error);
