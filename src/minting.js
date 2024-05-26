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
exports.mintByMintingAPI = void 0;
const sdk_1 = require("@imtbl/sdk");
const config_1 = __importDefault(require("./config"));
const config_2 = require("./config");
const logger_1 = __importDefault(require("./logger"));
const mintByMintingAPI = (contractAddress, walletAddress, uuid, metadata) => __awaiter(void 0, void 0, void 0, function* () {
    const config = {
        baseConfig: new sdk_1.config.ImmutableConfiguration({
            environment: config_2.environment,
        }),
        overrides: {
            basePath: config_1.default[config_2.environment].API_URL,
            headers: {
                "x-immutable-api-key": config_1.default[config_2.environment].HUB_API_KEY,
                "x-api-key": config_1.default[config_2.environment].RPS_API_KEY,
            },
        },
    };
    const client = new sdk_1.blockchainData.BlockchainData(config);
    const asset = {
        owner_address: walletAddress,
        reference_id: uuid,
        token_id: null,
    };
    if (metadata !== null) {
        asset.metadata = metadata;
    }
    try {
        const response = yield client.createMintRequest({
            chainName: config_1.default[config_2.environment].chainName,
            contractAddress,
            createMintRequestRequest: {
                assets: [asset],
            },
        });
        logger_1.default.info(`Mint request sent with UUID: ${uuid}`);
        logger_1.default.debug("Mint request response:", JSON.stringify(response, null, 2));
        console.log(response);
        return uuid;
    }
    catch (error) {
        logger_1.default.error("Error sending mint request:", error);
        console.log(error);
        throw error;
    }
});
exports.mintByMintingAPI = mintByMintingAPI;
