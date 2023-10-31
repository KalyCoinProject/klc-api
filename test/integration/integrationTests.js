import axios from 'axios';
//import chai from 'chai';
import nock from 'nock';
import { strict as assert } from 'assert';
import app from '../../src/index.js';
import { server } from '../../src/index.js';

//const expect = chai.expect;

const PORT = 3000;
//const server = app.listen(PORT);
const ALCHEMY_PAY_DOMAIN = process.env.ALCHEMY_PAY_DOMAIN;

describe('Integration Tests', function() {
    this.timeout(10000);  // Set timeout to 10 seconds for this test

    describe('Alchemy Pay Webhook Simulation', () => {


        it('should process the order correctly', async () => {
            nock.log = console.log;
            nock(ALCHEMY_PAY_DOMAIN)
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
            }).catch(error => {
                console.error("Error during test:", error.message);
                throw error;
            });

            assert.equal(response.data.returnCode, "0000");
            assert.equal(response.data.returnMsg, "eygyjppg");
        });

        after(() => {
            server.close();  // Close the server after tests are done
        });
    });
});
