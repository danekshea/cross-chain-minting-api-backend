// Import necessary libraries and modules
const fastify = require("fastify")({ logger: true });
const cors = require("@fastify/cors");
import { FastifyReply, FastifyRequest } from "fastify";
import serverConfig, { IMX_JWT_KEY_URL, environment } from "./config";
import { mintByMintingAPI } from "./minting";
import { verifyPassportToken, decodePassportToken, verifySNSSignature, returnActivePhase } from "./utils";
import { addTokenMinted, checkAddressMinted, totalMintCountAcrossAllPhases, updateUUIDStatus } from "./database";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import logger from "./logger";
import { ExtendedMintPhase, eoaMintRequest } from "./types";
import { recoverMessageAddress, verifyMessage, isAddress } from "viem";
import { ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";
import { error } from "console";

// Initialize Prisma Client for database interactions
const prisma = new PrismaClient();

// Define the metadata for the NFT
const metadata = serverConfig[environment].metadata;

// Enable CORS with specified options for API security and flexibility
fastify.register(cors, {
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE"], // Supported HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed HTTP headers
});

fastify.post("/event-webhook", async (request: any, reply: any) => {
  const webhookSecret = request.headers["goldsky-webhook-secret"];

  if (webhookSecret !== serverConfig[environment].WEBHOOK_SECRET) {
    return reply.status(403).send({ error: "Invalid webhook secret" });
  }

  const {
    op,
    data_source,
    data: { old, new: newData },
    webhook_name,
    webhook_id,
    id,
    delivery_info: { max_retries, current_retry },
    entity,
  } = request.body;

  const walletAddress = newData.to;

  // Additional processing if needed
  console.log(newData); // Example: Logging the "new" data
  console.log(`Wallet address: ${walletAddress}`); // Example: Logging the wallet address

  // Conduct transactional operations related to minting
  const uuid = uuidv4();
  logger.info(`Attempting to mint NFT wallet address ${walletAddress} with UUID ${uuid}`);
  try {
    // // Record the minting operation in the database
    // await addTokenMinted(walletAddress, uuid, "pending", prisma);

    // If all operations are successful, construct the response object
    const result = { collectionAddress: serverConfig[environment].collectionAddress, walletAddress, uuid };

    // Send the successful result back to the client
    reply.send(result);

    mintByMintingAPI(serverConfig[environment].collectionAddress, walletAddress, uuid, metadata)
      .then(() => {
        logger.info("Minting API call successful.");
      })
      .catch((apiError) => {
        logger.error(`Minting API call failed for ${walletAddress} and ${uuid}: ${apiError}`);
      });
  } catch (error) {
    // Determine the error type and respond accordingly
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Handle unique constraint violation
      logger.error(`Unique constraint failed for address: ${error}`);
      reply.status(401).send({ error: "Unauthorized: Duplicate entry for address" });
    } else {
      // Log the error that caused the transaction to fail
      logger.error(`Error during minting process: ${error}`);

      // Send a general error response to the client
      reply.status(500).send({ error: `Failed to process mint request: ${error}` });
    }
  }

  // Log the received webhook
  fastify.log.debug(`Received webhook: ${JSON.stringify(request.body, null, 2)}`);
});

fastify.post("/imx-webhook", async (request: any, reply: any) => {
  console.log(request);
  const { Type, SubscribeURL, TopicArn, Message, MessageId, Timestamp, Signature, SigningCertURL } = request.body;
  logger.debug(`Received webhook: ${JSON.stringify(request.body, null, 2)}`);

  if (Type === "SubscriptionConfirmation") {
    const allowedTopicArnPrefix = serverConfig[environment].allowedTopicArn.replace("*", "");

    if (TopicArn.startsWith(allowedTopicArnPrefix)) {
      try {
        const isValid = await verifySNSSignature(request.body);

        if (isValid) {
          const response = await axios.get(SubscribeURL);
          if (response.status === 200) {
            logger.info("Webhook subscription confirmed successfully");
          } else {
            logger.error("Failed to confirm webhook subscription");
          }
        } else {
          logger.warn("Invalid signature. Subscription confirmation denied.");
        }
      } catch (error) {
        logger.error(`Error confirming webhook subscription: ${JSON.stringify(error, null, 2)}`);
      }
    } else {
      logger.warn("Received subscription confirmation from an unknown TopicArn:", TopicArn);
    }

    reply.send({ status: "ok" });
  }

  if (Type === "Notification") {
    try {
      const isValid = await verifySNSSignature(request.body);
      if (isValid) {
        const message = JSON.parse(Message);
        const { event_name } = message;
        const { reference_id, token_id, status, owner_address } = message.data;
        if (event_name === "imtbl_zkevm_mint_request_updated") {
          logger.info("Received mint request update notification:");
          console.log(message);
          if (status === "succeeded") {
            logger.info(`Mint request ${reference_id} succeeded for owner address ${owner_address}`);
            updateUUIDStatus(reference_id, "succeeded", prisma);
          } else if (status === "pending") {
            logger.debug(`Mint request ${reference_id} is pending`);
          } else if (status === "failed") {
            logger.warn(`Mint request ${reference_id} failed for owner address ${owner_address}`);
            updateUUIDStatus(reference_id, "failed", prisma);
          }
        } else {
          logger.warn("Received notification for an unknown event:");
        }
      } else {
        logger.warn("Invalid signature. Notification denied.");
      }
    } catch (error) {
      logger.error(`Error processing notification: ${JSON.stringify(error, null, 2)}`);
    }
    reply.send({ status: "ok" });
  }
});

// Start the server
const start = async () => {
  try {
    // if (!checkConfigValidity(serverConfig[environment])) {
    //   throw new Error("Invalid server configuration. Exiting.");
    // }
    logger.info(`Attempting to start on IP ${serverConfig[environment].HOST_IP} and port ${serverConfig[environment].PORT}...`);

    await fastify.listen({
      port: serverConfig[environment].PORT,
      host: serverConfig[environment].HOST_IP,
    });

    logger.info(`Server started successfully on port ${serverConfig[environment].PORT}.`);
  } catch (err) {
    logger.error(`Error starting server: ${err}`);
    // Optionally, you might want to handle specific errors differently here
    process.exit(1);
  }
};

start();
