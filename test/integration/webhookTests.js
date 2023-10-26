import request from 'supertest';
import sinon from 'sinon';
import axios from 'axios';
import { strict as assert } from 'assert';
import app from '../../src/index';  // Adjust the path to your express app

describe('Webhook Handler Tests', () => {

    let axiosGetStub;

    beforeEach(() => {
        // Stub the axios.get method before each test
        axiosGetStub = sinon.stub(axios, 'get');
    });

    afterEach(() => {
        // Restore the stubbed method after each test
        axiosGetStub.restore();
    });

    it('should handle the webhook and fetch KLC price', async () => {
        // Mock the response from the KLC price API
        axiosGetStub.resolves({ data: { price: '100' } });

        const mockWebhookData = {
            // ... your mock webhook data
        };

        const response = await request(app)
            .post('/handleWebhook')
            .send(mockWebhookData);

        assert.equal(response.status, 200);
        assert.equal(response.body.returnCode, "0000");
        assert.equal(response.body.returnMsg, "Webhook received");
    });

    it('should handle errors when fetching KLC price', async () => {
        // Mock an error from the KLC price API
        axiosGetStub.rejects(new Error('Failed to fetch price'));

        const mockWebhookData = {
            // ... your mock webhook data
        };

        const response = await request(app)
            .post('/handleWebhook')
            .send(mockWebhookData);

        assert.equal(response.status, 500);
        assert.equal(response.text, 'Error fetching KLC price');
    });

    // ... Add more tests as needed

});
