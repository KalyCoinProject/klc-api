# KLC-API Documentation

## Overview

The `klc-api` is an API designed to facilitate interactions with KalyChain (KLC) via AlchemyPay. It allows users to purchase KLC tokens and ensures that transactions are securely processed and verified.

## Requirements

1. **Integration with AlchemyPay**: The API should be able to handle webhooks from AlchemyPay, verify them, and process the contained information.
2. **Interaction with EthSigner**: The API should be able to send transactions to EthSigner for signing and then forward the signed transactions to a specified wallet.
3. **Error Handling**: The API should be robust enough to handle errors, especially when sending tokens. If a transaction fails, the API should retry the transaction at regular intervals until a maximum retry limit is reached.
4. **Logging**: Every transaction, webhook acknowledgment, and error should be logged for traceability.
5. **Idempotency**: Ensure that the same webhook is not processed multiple times.
6. **Security**: The API should use JWT for added security when making JSON-RPC calls to the wallet.

## Features Implemented

### Webhook Handling

- The API listens for incoming POST requests containing transaction details from AlchemyPay.
- Each webhook is acknowledged immediately to inform AlchemyPay that the webhook has been received.
- The API checks if the webhook has been processed before to ensure idempotency.

### Transaction Processing

- Transactions are sent to EthSigner for signing.
- The signed transaction is then forwarded to the specified wallet for execution.
- If a transaction fails, the API retries the transaction at 60-second intervals until a maximum of 10 retries is reached.

### Error Handling and Logging

- All errors, especially those occurring during token sending, are logged.
- The API keeps track of the number of retries for each failed transaction.

### Security

- JWT and TLs is used to secure JSON-RPC calls to the wallet.
- Webhooks from AlchemyPay are verified to ensure they are genuine.

### Interaction with EthSigner

- The API creates a transaction payload with necessary details like the sender's address, recipient's address, amount, gas, gas price, and nonce.
- This payload is sent to EthSigner for signing.
- The signed transaction is then sent to the wallet for execution.

### Notification to AlchemyPay

- After a successful transaction, the API notifies AlchemyPay about the transaction status.
- This is done by sending a POST request to AlchemyPay's endpoint with details like order number, transaction status, transaction hash, block height, and a timestamp.

## Tools and Libraries Used

- **Express.js**: For setting up the server and handling HTTP requests.
- **Axios**: For making HTTP requests to EthSigner, the wallet, and AlchemyPay.
- **Crypto**: For generating signatures required by AlchemyPay.
- **Dotenv**: For accessing environment variables.

## Future Enhancements

1. **Admin Dashboard**: A dashboard to monitor and manage transactions, view logs, and handle errors.
2. **Webhook Verification**: Implement a robust mechanism to verify the authenticity of webhooks from AlchemyPay.

## Links and References

- [AlchemyPay Webhook Documentation](https://alchemypay.readme.io/docs/update-order-status)
- [EthSigner API Methods](https://docs.ethsigner.consensys.net/Reference/API-Methods#eth_sendtransaction)

