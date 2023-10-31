import { ethers } from 'ethers';
import { createHmac } from 'crypto';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const APP_ID = process.env.APP_ID;
const APP_SECRET = process.env.APP_SECRET;
const RPC_URL = process.env.RPC_URL;

const ADDRESS = '0x183F288BF7EEBe1A3f318F4681dF4a70ef32B2f3';
const ABI = [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)'
];
const provider = new ethers.JsonRpcProvider('https://rpc.kalychain.io/rpc');
const amountIn = ethers.parseEther('1');
const path = ['0x069255299Bb729399f3CECaBdc73d15d3D10a2A3', '0x37540F0cC489088c01631138Da2E32cF406B83B8'];
const router = new ethers.Contract(ADDRESS, ABI, provider);

async function getGasPrice() {
    try {
        const response = await axios.post(RPC_URL, {
            jsonrpc: "2.0",
            method: 'eth_gasPrice',
            params: [],
            id: 1
        });

        if (response.data && response.data.result) {
            return ethers.formatUnits(response.data.result, "gwei");
        } else {
            throw new Error("Failed to fetch gas price from RPC");
        }
    } catch (error) {
        console.error("Error fetching gas price:", error);
        throw error;
    }
}


class HmacUtil {
    static hmac256(key, msg) {
        const mac = createHmac('sha256', key);
        return mac.update(msg).digest('hex').toLowerCase();
    }

    static getStringToSign(params) {
        const treeMap = new Map(Object.entries(params).sort());
        let s2s = '';
        for (const [k, v] of treeMap) {
            if (!k || typeof v === 'object') continue;
            if (v !== null && v !== undefined && String(v)) s2s += `${k}=${v}&`;
        }
        return s2s.slice(0, -1);
    }
}

const getKlcPrice = async (req, res) => {
    try {
        const amounts = await router.getAmountsOut(amountIn, path);
        const price = ethers.formatUnits(amounts[1].toString(), 18);
        const networkFee = await getGasPrice();
        
        // Construct the response data
        const responseData = {
            data: {
                price: price,
                networkList: [
                    {
                        network: "KALY",
                        networkFee: networkFee
                    }
                ]
            },
            success: true,
            returnCode: "0000",
            returnMsg: "Success",
        };

        const timestamp = String(Date.now());
        const stringToSign = HmacUtil.getStringToSign({
            appId: APP_ID,
            timestamp: timestamp,
            ...responseData
        });
        const signature = HmacUtil.hmac256(APP_SECRET, stringToSign);

        // Compute the hashHex for the signature
        const hash = createHmac('sha1', APP_SECRET).update(signature).digest('hex');

        res.setHeader('appId', APP_ID);
        res.setHeader('timestamp', timestamp);
        res.setHeader('sign', hash); // Use the computed hashHex as the signature
        res.setHeader('Content-Type', 'application/json; charset=utf-8'); // Set the content type header
        res.json(responseData);

    } catch (error) {
        console.error("Error fetching KLC price:", error);
        res.status(500).json({
            data: null,
            success: false,
            returnCode: "9999",
            returnMsg: "Internal server error",
        });
    }
}

export {
    getKlcPrice
};
