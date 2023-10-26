import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { logger } from './config/logger.js';
import { requestLogger, errorLogger } from './middlewares/loggingMiddleware.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(requestLogger);
const PORT = 3000;

// Access environment variables
const APP_SECRET = process.env.APP_SECRET;
const RPC_URL = process.env.RPC_URL;
const ALCHEMY_PAY_DOMAIN = 'https://openapi.alchemypay.org'; // Update for production URL if needed
const ETHSIGNER_URL = 'http://localhost:8545';  // Run EthSigner on localhost

const MAX_RETRIES = 1;
const RETRY_INTERVAL = 60000; // 60 seconds in milliseconds

const processedWebhooks = new Set(); // To store processed webhook IDs for idempotency

app.use(express.json());

// Function to generate the signature for AlchemyPay
function generateSignature(orderNo, status) {
    const rawString = `${orderNo}${status}${APP_SECRET}`;
    return crypto.createHash('md5').update(rawString).digest('hex');
}

app.post('/handleWebhook', async (req, res) => {
    const { appId, timestamp, sign } = req.headers;
    const { orderNo, crypto, network, address, cryptoAmount, webhookId } = req.body;

    // Idempotency check
    if (processedWebhooks.has(webhookId)) {
        console.log(`Webhook ID ${webhookId} already processed.`);
        return res.status(200).send('Webhook already processed');
    }

    // Check if the crypto is 'KLC'
    if (crypto.toUpperCase() !== 'KLC') {
        console.error('Received a webhook for a different crypto:', crypto);
        return res.status(400).send('Invalid crypto type');
    }

    // Kaly Mainnet is '3888' Testnet is '3889'
    if (network.toString() !== '3889') {
        console.error('Received a webhook for a different network:', network);
        return res.status(400).send('Invalid network type');
    }

    // Webhook Acknowledgment
    res.json({
        data: null,
        success: true,
        returnCode: "0000",
        returnMsg: "Webhook received"
    });

    let retries = 0;
    let transactionSuccess = false;

    while (retries < MAX_RETRIES && !transactionSuccess) {
        try {
            const hexCryptoAmount = '0x' + parseInt(cryptoAmount).toString(16);

            const transactionPayload = {
                from: '0x095D61Bd263b3e00811b37Bb18efa907540df5B7',
                to: address,
                value: hexCryptoAmount,
                gas: '0x76c0',
                gasPrice: '0x9184e72a000',
            };

            console.log('Sending request to EthSigner with payload:', transactionPayload);

            const ethSignerResponse = await axios.post(ETHSIGNER_URL, {
                jsonrpc: "2.0",
                method: 'eth_sendTransaction',
                params: [transactionPayload],
                id: 1
            });

            console.log("EthSigner Response:", ethSignerResponse.data);
            const signedTxHash = ethSignerResponse.data.result;

            if (signedTxHash) {
                transactionSuccess = true;
                console.log(`Transaction successful with hash: ${signedTxHash}`);
                processedWebhooks.add(webhookId);

                const walletRpcResponse = await axios.post(RPC_URL, {
                    method: 'eth_sendRawTransaction',
                    params: [signedTxHash]
                });

                const txHash = walletRpcResponse.data.result;

                if (txHash) {
                    const txReceipt = await axios.post(ETHSIGNER_URL, {
                        method: 'eth_getTransactionReceipt',
                        params: [txHash]
                    });

                    const gasUsed = txReceipt.data.result.gasUsed;
                    const networkFee = BigInt(gasUsed) * BigInt(transactionPayload.gasPrice);

                    const status = "success";
                    const signature = generateSignature(orderNo, status);

                    const blockResponse = await axios.post(ETHSIGNER_URL, {
                        jsonrpc: "2.0",
                        method: "eth_blockNumber",
                        params: [],
                        id: 51
                    });
                    const blockHeight = blockResponse.data.result;

                    const currentTimestamp = Math.floor(Date.now() / 1000);

                    const alchemyResponse = await axios.post(`${ALCHEMY_PAY_DOMAIN}/webhooks/treasure`, {
                        orderNo,
                        status,
                        sign: signature,
                        txHash,
                        blockHeight,
                        timestamp: currentTimestamp,
                        crypto,
                        cryptoAmount,
                        cryptoPrice,
                        network,
                        networkFee: networkFee.toString(),
                        address
                    });

                    //dev
                    const transactionOutput = {
                        orderNo,
                        status,
                        sign: signature,
                        txHash,
                        blockHeight,
                        timestamp: currentTimestamp,
                        crypto,
                        cryptoAmount,
                        cryptoPrice,
                        network,
                        networkFee: networkFee.toString(),
                        address
                    };
                    
                    // Define the path to the file
                    const filePath = path.join(__dirname, 'transactionOutput.json');
                    
                    // Write the data to the file
                    fs.writeFileSync(filePath, JSON.stringify(transactionOutput, null, 4));
                    

                    if (alchemyResponse.data.returnCode !== "0000") {
                        console.error("Failed to update order status on AlchemyPay:", alchemyResponse.data.returnMsg);
                    }
                } else {
                    console.error('Transaction failed without a hash.');
                    retries++;
                    if (retries < MAX_RETRIES) {
                        console.log(`Retrying Ethereum transaction in ${RETRY_INTERVAL / 1000} seconds...`);
                        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing the webhook: ${error.message}`);
            retries++;
            if (retries < MAX_RETRIES) {
                console.log(`Retrying Ethereum transaction in ${RETRY_INTERVAL / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
            }
        }
    }

    if (!transactionSuccess) {
        console.error(`Failed to process transaction after ${MAX_RETRIES} retries.`);
    }
});

app.use(errorLogger);

const server = app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});

export { server };
export { generateSignature }
export default app;
