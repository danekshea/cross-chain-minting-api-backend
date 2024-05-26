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
exports.updateUUIDStatus = exports.totalMintCountAcrossAllPhases = exports.checkAddressMinted = exports.addTokenMinted = void 0;
const logger_1 = __importDefault(require("./logger"));
function addTokenMinted(address, uuid, status, prisma) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma.mints.create({
                data: { address, uuid, status },
            });
            logger_1.default.info(`Added minted token with ${uuid} for address ${address}.`);
        }
        catch (error) {
            logger_1.default.error(`Error adding minted token with ${uuid} for address ${address}: ${error}`);
            throw error;
        }
    });
}
exports.addTokenMinted = addTokenMinted;
function checkAddressMinted() {
    return __awaiter(this, arguments, void 0, function* (address = "0x42c2d104C05A9889d79Cdcd82F69D389ea24Db9a", prisma) {
        var _a;
        try {
            logger_1.default.info(`Checking if user has minted: ${address}`);
            const mintedAddress = yield prisma.mints.findUnique({
                where: {
                    address: address,
                },
            });
            logger_1.default.info(`User has minted: ${mintedAddress !== null}`);
            return (_a = mintedAddress === null || mintedAddress === void 0 ? void 0 : mintedAddress.uuid) !== null && _a !== void 0 ? _a : null;
        }
        catch (error) {
            logger_1.default.error(`Error checking if user has minted: ${error}`);
            throw error;
        }
    });
}
exports.checkAddressMinted = checkAddressMinted;
function totalMintCountAcrossAllPhases(prisma) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const mintCount = yield prisma.mints.count();
            return mintCount;
        }
        catch (error) {
            logger_1.default.error(`Error getting total mint count: ${error}`);
            throw error;
        }
    });
}
exports.totalMintCountAcrossAllPhases = totalMintCountAcrossAllPhases;
// export async function loadAddressesIntoAllowlist(addresses: string[], phase: number, prisma: PrismaClient) {
//   try {
//     for (let address of addresses) {
//       await prisma.allowlist.create({
//         data: {
//           address: address.toLowerCase(),
//           phase: phase,
//         },
//       });
//     }
//     console.log("Addresses have been successfully loaded into the database.");
//   } catch (error) {
//     console.error("Error loading addresses into the database:", error);
//   }
// }
// export async function readAddressesFromAllowlist(phase: number, prisma: PrismaClient): Promise<string[]> {
//   try {
//     const addresses = await prisma.allowlist.findMany({
//       where: {
//         phase: phase,
//       },
//     });
//     return addresses.map((address) => address.address.toLowerCase());
//   } catch (error) {
//     console.error("Error reading addresses from the database:", error);
//     throw error;
//   }
// }
function updateUUIDStatus(uuid, status, prisma) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma.mints.updateMany({
                where: {
                    uuid: uuid,
                },
                data: {
                    status: status,
                },
            });
            logger_1.default.info(`Updated status for UUID ${uuid} to ${status}.`);
        }
        catch (error) {
            logger_1.default.error(`Error updating status for UUID ${uuid}: ${error}`);
            throw error;
        }
    });
}
exports.updateUUIDStatus = updateUUIDStatus;
