// tests.js

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/index');  
const expect = chai.expect;

chai.use(chaiHttp);

describe('Webhook Handling', () => {

  it('should acknowledge the webhook', (done) => {
    chai.request(app)
      .post('/handleWebhook')
      .send({
        orderNo: 'testOrder123',
        crypto: 'KLC',
        network: '3889',
        address: 'testAddress',
        cryptoAmount: '1',
        cryptoPrice: '100',
        webhookId: 'testWebhookId'
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('returnCode').eql('0000');
        expect(res.body).to.have.property('returnMsg').eql('Webhook received');
        done();
      });
  });

  it('should reject an invalid crypto type', (done) => {
    chai.request(app)
      .post('/handleWebhook')
      .send({
        orderNo: 'testOrder123',
        crypto: 'BTC',
        network: '3889',
        address: 'testAddress',
        cryptoAmount: '1',
        cryptoPrice: '100',
        webhookId: 'testWebhookId2'
      })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.text).to.equal('Invalid crypto type');
        done();
      });
  });

  it('should reject an invalid network type', (done) => {
    chai.request(app)
      .post('/handleWebhook')
      .send({
        orderNo: 'testOrder123',
        crypto: 'KLC',
        network: '1',
        address: 'testAddress',
        cryptoAmount: '1',
        cryptoPrice: '100',
        webhookId: 'testWebhookId3'
      })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.text).to.equal('Invalid network type');
        done();
      });
  });

  // TODO - Add more tests for other scenarios, such as:
  // - Handling of duplicate webhook IDs
  // - Successful transaction processing
  // - Failed transaction processing after retries
  // - Webhook verification logic (once implemented)
  // - Any other edge cases or scenarios we can think of

});

