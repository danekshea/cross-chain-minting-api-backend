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
// Import necessary libraries and modules
const fastify = require("fastify")({ logger: true });
const cors = require("@fastify/cors");
const config_1 = __importStar(require("./config"));
const minting_1 = require("./minting");
const utils_1 = require("./utils");
const database_1 = require("./database");
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("./logger"));
const uuid_1 = require("uuid");
const client_2 = require("@prisma/client");
// Initialize Prisma Client for database interactions
const prisma = new client_1.PrismaClient();
// Define the metadata for the NFT
const metadata = config_1.default[config_1.environment].metadata;
// Enable CORS with specified options for API security and flexibility
fastify.register(cors, {
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE"], // Supported HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed HTTP headers
});
fastify.post("/event-webhook", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const { op, data_source, data: { old, new: newData }, webhook_name, webhook_id, id, delivery_info: { max_retries, current_retry }, entity, } = request.body;
    const walletAddress = newData.to;
    // Additional processing if needed
    console.log(newData); // Example: Logging the "new" data
    console.log(`Wallet address: ${walletAddress}`); // Example: Logging the wallet address
    // Conduct transactional operations related to minting
    const uuid = (0, uuid_1.v4)();
    logger_1.default.info(`Attempting to mint NFT wallet address ${walletAddress} with UUID ${uuid}`);
    try {
        // // Record the minting operation in the database
        // await addTokenMinted(walletAddress, uuid, "pending", prisma);
        // If all operations are successful, construct the response object
        const result = { collectionAddress: config_1.default[config_1.environment].collectionAddress, walletAddress, uuid };
        // Send the successful result back to the client
        reply.send(result);
        (0, minting_1.mintByMintingAPI)(config_1.default[config_1.environment].collectionAddress, walletAddress, uuid, metadata)
            .then(() => {
            logger_1.default.info("Minting API call successful.");
        })
            .catch((apiError) => {
            logger_1.default.error(`Minting API call failed for ${walletAddress} and ${uuid}: ${apiError}`);
        });
    }
    catch (error) {
        // Determine the error type and respond accordingly
        if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            // Handle unique constraint violation
            logger_1.default.error(`Unique constraint failed for address: ${error}`);
            reply.status(401).send({ error: "Unauthorized: Duplicate entry for address" });
        }
        else {
            // Log the error that caused the transaction to fail
            logger_1.default.error(`Error during minting process: ${error}`);
            // Send a general error response to the client
            reply.status(500).send({ error: `Failed to process mint request: ${error}` });
        }
    }
    // Log the received webhook
    fastify.log.debug(`Received webhook: ${JSON.stringify(request.body, null, 2)}`);
}));
fastify.post("/imx-webhook", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(request);
    const { Type, SubscribeURL, TopicArn, Message, MessageId, Timestamp, Signature, SigningCertURL } = request.body;
    logger_1.default.debug(`Received webhook: ${JSON.stringify(request.body, null, 2)}`);
    if (Type === "SubscriptionConfirmation") {
        const allowedTopicArnPrefix = config_1.default[config_1.environment].allowedTopicArn.replace("*", "");
        if (TopicArn.startsWith(allowedTopicArnPrefix)) {
            try {
                const isValid = yield (0, utils_1.verifySNSSignature)(request.body);
                if (isValid) {
                    const response = yield axios_1.default.get(SubscribeURL);
                    if (response.status === 200) {
                        logger_1.default.info("Webhook subscription confirmed successfully");
                    }
                    else {
                        logger_1.default.error("Failed to confirm webhook subscription");
                    }
                }
                else {
                    logger_1.default.warn("Invalid signature. Subscription confirmation denied.");
                }
            }
            catch (error) {
                logger_1.default.error(`Error confirming webhook subscription: ${JSON.stringify(error, null, 2)}`);
            }
        }
        else {
            logger_1.default.warn("Received subscription confirmation from an unknown TopicArn:", TopicArn);
        }
        reply.send({ status: "ok" });
    }
    if (Type === "Notification") {
        try {
            const isValid = yield (0, utils_1.verifySNSSignature)(request.body);
            if (isValid) {
                const message = JSON.parse(Message);
                const { event_name } = message;
                const { reference_id, token_id, status, owner_address } = message.data;
                if (event_name === "imtbl_zkevm_mint_request_updated") {
                    logger_1.default.info("Received mint request update notification:");
                    console.log(message);
                    if (status === "succeeded") {
                        logger_1.default.info(`Mint request ${reference_id} succeeded for owner address ${owner_address}`);
                        (0, database_1.updateUUIDStatus)(reference_id, "succeeded", prisma);
                    }
                    else if (status === "pending") {
                        logger_1.default.debug(`Mint request ${reference_id} is pending`);
                    }
                    else if (status === "failed") {
                        logger_1.default.warn(`Mint request ${reference_id} failed for owner address ${owner_address}`);
                        (0, database_1.updateUUIDStatus)(reference_id, "failed", prisma);
                    }
                }
                else {
                    logger_1.default.warn("Received notification for an unknown event:");
                }
            }
            else {
                logger_1.default.warn("Invalid signature. Notification denied.");
            }
        }
        catch (error) {
            logger_1.default.error(`Error processing notification: ${JSON.stringify(error, null, 2)}`);
        }
        reply.send({ status: "ok" });
    }
}));
// Start the server
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // if (!checkConfigValidity(serverConfig[environment])) {
        //   throw new Error("Invalid server configuration. Exiting.");
        // }
        logger_1.default.info(`Attempting to start on IP ${config_1.default[config_1.environment].HOST_IP} and port ${config_1.default[config_1.environment].PORT}...`);
        yield fastify.listen({
            port: config_1.default[config_1.environment].PORT,
            host: config_1.default[config_1.environment].HOST_IP,
        });
        logger_1.default.info(`Server started successfully on port ${config_1.default[config_1.environment].PORT}.`);
    }
    catch (err) {
        logger_1.default.error(`Error starting server: ${err}`);
        // Optionally, you might want to handle specific errors differently here
        process.exit(1);
    }
});
start();
