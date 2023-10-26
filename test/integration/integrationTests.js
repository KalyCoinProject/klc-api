import axios from 'axios';
import nock from 'nock';
import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import app from '../../src/index.js';

const PORT = 3001;
const server = app.listen(PORT);

describe('Integration Tests', function() {
    this.timeout(10000);  // Set timeout to 10 seconds for this test

  describe('/handleWebhook endpoint', () => {

    it('should process a valid webhook and save transaction data', async () => {
      // Simulate an incoming order from AlchemyPay
      nock('https://openapi.alchemypay.org')
        .post('/webhooks/treasure')
        .once()  // This ensures the mock will only reply once
        .reply(200, {
          orderNo: 'sampleOrder123',
          crypto: 'KLC',
          network: '3889',
          address: '0xaE51f2EfE70e57b994BE8F7f97C4dC824c51802a',
          cryptoAmount: '1',
          cryptoPrice: '1',
          webhookId: 'sampleWebhookId'
        });

      const response = await axios.post(`http://localhost:${PORT}/handleWebhook`, {
        orderNo: 'sampleOrder123',
        crypto: 'KLC',
        network: '3889',
        address: '0xaE51f2EfE70e57b994BE8F7f97C4dC824c51802a',
        cryptoAmount: '1',
        cryptoPrice: '1',
        webhookId: 'sampleWebhookId'
      });

      assert.equal(response.data.returnCode, "0000");
      assert.equal(response.data.returnMsg, "Webhook received");

      // Read the contents of the transactionOutput.json file
const transactionData = JSON.parse(fs.readFileSync('transactionOutput.json', 'utf-8'));

// Now you can make assertions on the transactionData, e.g.,
assert.equal(transactionData.orderNo, 'sampleOrder123');
// ... other assertions ...
});

    //   const transactionData = response.data.transaction;
    //   if (transactionData) {
    //     fs.writeFileSync('transactionOutput.json', JSON.stringify(transactionData, null, 2));
    //     console.log(fs.readFileSync('transactionOutput.json', 'utf-8'));
    // } else {
    //     console.error('No transaction data to write.');
    // }


    //   // Print out the contents of the file
    //   console.log(fs.readFileSync('transactionOutput.json', 'utf-8'));
    // });

    it('should reject an invalid crypto type', async () => {
        try {
            await axios.post(`http://localhost:${PORT}/handleWebhook`, {
                // Invalid crypto type
                crypto: 'INVALID_CRYPTO',
            });
            assert.fail('Expected an error to be thrown');
        } catch (error) {
            assert.equal(error.response.status, 400);
            assert.equal(error.response.data, 'Invalid crypto type');
        }
    });

    it('should handle AlchemyPay error responses', async () => {
        // Mock the AlchemyPay response to simulate an error
        nock('https://openapi.alchemypay.org')
            .post('/webhooks/treasure')
            .reply(500, { error: 'Simulated AlchemyPay error' });

        // ... rest of the test logic
    });

    it('should handle retries correctly', async () => {
        // This test would simulate a scenario where the first few attempts to process the webhook fail, but a subsequent attempt succeeds
        // You can use nock to mock failures for the first few attempts and then a success
    });

    it('should handle idempotency correctly', async () => {
        // Send the same webhook data multiple times
        for (let i = 0; i < 3; i++) {
            await axios.post(`http://localhost:${PORT}/handleWebhook`, {
                orderNo: 'sampleOrder123',
                crypto: 'KLC',
                network: '3889',
                address: '0xaE51f2EfE70e57b994BE8F7f97C4dC824c51802a',
                cryptoAmount: '1',
                cryptoPrice: '1',
                webhookId: 'sampleWebhookId'
            });
        }
        // Ensure that the processing logic (like sending transactions) only happens once
        // This can be done by monitoring logs, checking database entries, or other side effects
    });

  });

  // ... other test suites

  
});

after(() => {
    server.close();  // Close the server after tests are done
});
