import axios from 'axios';

const simulateWebhook = async () => {
    // Fetch the KLC price from the live endpoint
    let cryptoPrice;
    try {
        const priceResponse = await axios.get('https://api.kalyswap.io/kalyswap/klc-price');
        cryptoPrice = priceResponse.data.price;
    } catch (error) {
        console.error('Error fetching KLC price:', error.message);
        return;  // Exit if there's an error fetching the price
    }

    const webhookData = {
        appId: 'YOUR_APP_ID',  // Replace with your actual App ID
        timestamp: Date.now(),
        sign: 'YOUR_SIGNATURE',  // This should be a valid signature. For testing, you can use any string.
        orderNo: 'sampleOrder123',
        crypto: 'KLC',
        network: '3889',
        address: '0xYourEthereumAddress',
        cryptoAmount: '10',  // Example amount
        cryptoPrice,  // Use the fetched price
        webhookId: 'sampleWebhookId123'
    };

    try {
        const response = await axios.post('http://localhost:3000/handleWebhook', webhookData);
        console.log('Webhook simulation response:', response.data);
    } catch (error) {
        console.error('Error simulating webhook:', error.message);
    }
};

simulateWebhook();
