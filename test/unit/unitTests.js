
import { strict as assert } from 'assert';
import { generateSignature } from '../../src/index.js';  

describe('Unit Tests', () => {

    describe('generateSignature()', () => {

        it('should generate a correct signature', () => {
            const orderNo = 'sampleOrder123';
            const status = 'success';
            const expectedSignature = '6cec2ea6e4ba25bca98b954ee0ed0545';  // Replace with an actual expected value
            const result = generateSignature(orderNo, status);
            assert.equal(result, expectedSignature);
        });

        // Add more test cases as needed

    });

    // Test other pure functions here

});
