# KLC API

An API to interact with KalyChain to buy KLC via AlchemyPay.

## Description

This API serves as a bridge between AlchemyPay and KalyChain, allowing users to purchase KLC tokens. It handles incoming webhooks from AlchemyPay, processes transactions, and communicates with the KalyChain network.

## Setup & Installation

1. **Clone the Repository**:
```bash
git clone https://git.cipherlabs.org/TheDude/klc-api.git
```
```bash
cd klc-api
```

2. **Install Dependencies**:
`npm install`


3. **Environment Variables**:
- Create a `.env` file in the root directory.
- Add the necessary environment variables:
  ```
  APP_SECRET=your_app_secret
  RPC_URL=your_rpc_url
  YOUR_JWT_TOKEN=your_jwt_token
  ```

4. **Start the API**:
`npm start`

## Local Setup & Development

Please see [localDev.md](docs/localDev.md)

## Features

- **Webhook Handling**: Processes incoming webhooks from AlchemyPay.
- **Transaction Management**: Sends transactions to the KalyChain network.
- **Idempotency**: Ensures that webhooks are processed only once.
- **Error Handling & Retries**: In case of transaction failures, the API retries up to 10 times at 60-second intervals.

## Contributing

If you'd like to contribute, please fork the repository and make changes as you'd like. Pull requests are warmly welcome.

## License

This project is licensed under the MIT License.

## Credits

Developed by NicoDFS a.k.a TheDude.
