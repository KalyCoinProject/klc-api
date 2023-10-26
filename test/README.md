### Setup:
- Ensure EthSigner is running and connected to a testnet wallet.
- Update your main application code to use the test environment URL (`https://openapi-test.alchemypay.org`) when in a test mode. You can use an environment variable to switch between test and production modes.

### Writing the Tests:
- The tests will make real calls to EthSigner and the testnet.
- Ensure you have enough testnet funds in the wallet connected to EthSigner.

### Running the Tests:
- Start your application in test mode.
- Run your test script. This will send real transactions on the testnet and interact with the AlchemyPay test environment.
