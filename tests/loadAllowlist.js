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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const utils_1 = require("../src/utils");
const prisma = new client_1.PrismaClient();
const loadPercentage = 100; // Percentage of the allowlist to load
(() => __awaiter(void 0, void 0, void 0, function* () {
    const filePath = "tests/signers.csv"; // Path to the CSV file containing Ethereum addresses and signatures
    try {
        const signers = yield (0, utils_1.readAddressesFromCSV)(filePath);
        if (signers.length > 0) {
            const totalToLoad = Math.ceil((signers.length * loadPercentage) / 100);
            const addressesToLoad = signers.slice(0, totalToLoad).map((signer) => signer.address);
            // Load the defined percentage of addresses into the allowlist
            // await loadAddressesIntoAllowlist(addressesToLoad, 1, prisma);
            console.log(`Loaded ${totalToLoad} addresses (out of ${signers.length}) into the allowlist.`);
        }
        else {
            console.log("No addresses to load.");
        }
    }
    catch (error) {
        console.error("Error:", error);
    }
    // try {
    //   const addresses = await readAddressesFromAllowlist(0);
    //   addresses.forEach((address) => console.log(address));
    // } catch (error) {
    //   console.error("Error reading addresses from the database:", error);
    // }
}))();
