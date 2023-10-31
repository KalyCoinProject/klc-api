import express from 'express';
import axios from 'axios';
import { ethers } from 'ethers';
import { JsonRpcProvider } from 'ethers/providers';
import crypto from 'crypto';
import nodeCrypto from 'crypto';
import { logger } from './config/logger.js';
import { requestLogger, errorLogger } from './middlewares/loggingMiddleware.js';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import{getKlcPrice}from'./getPrice.js';

dotenv.config();

const app = express();
app.use(requestLogger);
const PORT = 3000;

app.get('/getKlcPrice', async (req, res) => {
    try {
        await getKlcPrice(req, res);
    } catch (error) {
        logger.error("Error fetching KLC price:", error);
        res.status(500).json({ error: 'Failed to fetch KLC price.' });
    }
});

const APP_ID = process.env.APP_ID;
const APP_SECRET = process.env.APP_SECRET;
const RPC_URL = process.env.RPC_URL;
const ETHSIGNER_URL = 'http://localhost:8545';
const ALCHEMY_PAY_DOMAIN = process.env.ALCHEMY_PAY_DOMAIN;

const provider = new JsonRpcProvider(RPC_URL);

const processedWebhooks = new Set();

app.use(express.json());

function generateSignature() {
    const rawString = `$${APP_ID}${APP_SECRET}${timestamp}`;
    return crypto.createHash('sha1').update(rawString).digest('hex');
}

function setAlchemyHeaders(res) {
    const timestamp = Date.now().toString(); // UTC time in milliseconds
    const rawString = `${APP_ID}${APP_SECRET}${timestamp}`;
    const sign = nodeCrypto.createHash('sha1').update(rawString).digest('hex');

    res.setHeader('appId', APP_ID);
    res.setHeader('timestamp', timestamp);
    res.setHeader('sign', sign);
}


app.post('/handleWebhook', async (req, res) => {
logger.info("Webhookreceived")    
const { orderNo, crypto, network, address, cryptoAmount, cryptoPrice } = req.body;

	//Thisiscasuingsomeissues,we need to handle Idempotency differently.    
	// const filePath = path.join(__dirname, '..', '..', 'txs', `${orderNo}.json`);
	// console.log(`Checking for file: ${filePath}`);
    // if (fs.existsSync(filePath)) {
    //     console.log(`Order ID ${orderNo} already processed and saved to file.`);
    //     return res.status(400).send('Order ID already processed and saved to file.');
    // }

    if (processedWebhooks.has(orderNo)) {
        logger.info(`Webhook ID ${orderNo} already processed in current session.`);
        return res.status(400).send('Webhook ID already processed in current session.');
    }

    if (crypto.toUpperCase() !== 'KLC') {
        logger.error('Received a webhook for a different crypto:', crypto);
        return res.status(400).send('Invalid crypto type');
    }

    if (network.toString() !== '3889') {
        logger.error('Received a webhook for a different network:', network);
        return res.status(400).send('Invalid network type');
    }

     // Webhook Acknowledgment
    //   res.setHeader('appId', APP_ID);
    //   res.setHeader('timestamp', timestamp);
    //   res.setHeader('sign', sign);
    // res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // setAlchemyHeaders(res);
    //  res.json({
    //     data: null,
    //     success: true,
    //     returnCode: "0000",
    //     returnMsg: "Webhook received"
    // });

    try {
        const hexCryptoAmount = '0x' + parseInt(cryptoAmount).toString(16);
        const transactionPayload = {
            from: '0x095D61Bd263b3e00811b37Bb18efa907540df5B7',
            to: address,
            value: hexCryptoAmount,
            gas: '0x76c0', // could be lowered to gas: 0x5208 and gasPrice: 0x76c0, I kept it high for faster tx.
            gasPrice: '0x9184e72a000',
        };

        logger.info('Sending request to EthSigner with payload:', transactionPayload);
        const ethSignerResponse = await axios.post(ETHSIGNER_URL, {
            jsonrpc: "2.0",
            method: 'eth_sendTransaction',
            params: [transactionPayload],
            id: 1
        });

        const txHash = ethSignerResponse.data.result;
        if (txHash) {
            console.log(`Transaction hash from EthSigner: ${txHash}`);

            let txReceipt = null;
            let attempts = 0;
            const maxAttempts = 10; // Adjust this if needed
            const delay = 2000; // 2 seconds delay

            while (!txReceipt && attempts < maxAttempts) {
                attempts++;
                console.log(`Fetching receipt, attempt ${attempts}...`);

                const receiptResponse = await axios.post(RPC_URL, {
                    jsonrpc: "2.0",
                    method: 'eth_getTransactionReceipt',
                    params: [txHash],
                    id: 1
                });
                txReceipt = receiptResponse.data.result;

                if (!txReceipt) {
                    console.log(`Receipt not available yet. Waiting for ${delay / 1000} seconds before next attempt.`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }

            if (txReceipt) {
                console.log("Transaction Receipt:", txReceipt);
            } else {
                logger.error(`Failed to fetch receipt after ${maxAttempts} attempts.`);
                res.status(500).send(`Failed to fetch receipt after ${maxAttempts} attempts.`);
            }

                if (txReceipt.status === "0x1") {
                    console.log(`Transaction successful with hash: ${txHash}`);
                    processedWebhooks.add(orderNo);
                
            // This works but I replaced it with eth_getTransactionReceipt method
            // const txReceipt = await provider.waitForTransaction(txHash);
            // console.log("Transaction Receipt:", txReceipt);

            // if (txReceipt.status === 1) {
            //     console.log(`Transaction successful with hash: ${txHash}`);
            //     processedWebhooks.add(orderNo);
            
            // Data from eth_getTransactionReceipt & block explorer link
             //const txHash = txReceipt.transactionHash;
             const gasUsed = parseInt(txReceipt.gasUsed, 16); 
             const networkFeeInGwei = gasUsed;
             const networkFeeInEth = networkFeeInGwei * 1e-9;
             const address = txReceipt.to;
             //const networkFee = parseInt(txReceipt.gasUsed, 16);
             const status = (txReceipt.status === '0x1') ? 'success' : 'fail';   
             const blockExplorerLink = `https://kalyscan.io/tx/${txHash}`;

             // Generate the timestamp
            const timestamp = Date.now().toString(); // UTC time in milliseconds

            // // Calculate the sign
            // const rawString = `${APP_ID}${APP_SECRET}${timestamp}`;
            // const sign = nodeCrypto.createHash('sha1').update(rawString).digest('hex');

            // Set the headers in the response
            setAlchemyHeaders(res);


            // Create the transaction output object
             const alchemyResponse = await axios.post(`${ALCHEMY_PAY_DOMAIN}/webhooks/treasure`, {
                 orderNo,
                 crypto,
                 cryptoAmount,
                 cryptoPrice,
                 txHash,
                 network,
                 networkFee: networkFeeInEth.toFixed(9),
                 address: address,
                 status: status,
                 blockExplorer: blockExplorerLink
                 //sign: generateSignature(orderNo, "success"),
                 //blockHeight: txReceipt.blockNumber,
                 //timestamp: Math.floor(Date.now() / 1000),
                                   
            });

            // Send the response
                res.json({
                    data: null,
                    success: true,
                    returnCode: "0000",
                    returnMsg: "eygyjppg",
                    traceID: "ypezrcpbszcigtinqnmmryxhpwmsmuryklusiofdleai"
                });

                
               
                // const blockExplorerLink = `https://testnet.kalyscan.io/tx/${txHash}`;
            
                // Create the transaction output object
                 const transactionOutput = {
                    orderNo,
                    crypto,
                    cryptoAmount,
                    cryptoPrice,
                    txHash,
                    network: "KALY",
                    networkFee: networkFeeInEth.toFixed(9),
                    address: address,
                    status: status,
                    blockExplorer: blockExplorerLink
                 };
            
                // Determine the directory path and check if it exists, if not, create it
                const __dirname = fileURLToPath(new URL('.', import.meta.url));
                const dirPath = path.join(__dirname, '..', 'txs');
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath);
                }
            
                // Write the transaction details to a file
                const filePath = path.join(dirPath, `${orderNo}.json`);
                console.log(`Attempting to write transaction details to: ${filePath}`);
                try {
                    fs.writeFileSync(filePath, JSON.stringify(transactionOutput, null, 4));
                    console.log(`Successfully wrote transaction details to: ${filePath}`);
                } catch (fileError) {
                    console.error(`Error writing to file: ${fileError.message}`);
                }
                
                // This bit of code will casue "Error processing the webhook: Cannot set headers after they are sent to the client"
                // res.json({
                //     data: null,
                //     success: true,
                //     returnCode: "0000",
                //     returnMsg: "Webhook received"
                // });
            } else {
                logger.info('Transaction failed.');
                res.status(500).send('Transaction failed.');
            }
        } else {
            logger.error('Failed to obtain transaction hash from EthSigner.');
            res.status(500).send('Failed to obtain transaction hash.');
        }
    } catch (error) {
        logger.error(`Error processing the webhook: ${error.message}`);
        res.status(500).send(`Error processing the webhook: ${error.message}`);
    }
});

app.use(errorLogger);

const server = app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});

export { server };
export { generateSignature };
export default app;