

# API Setup Guide

This guide provides step-by-step instructions on how to set up and run the API for development testing. In production you should configure EthSigner to store keys externally with Azure Key Vault or HashiCorp Vault. TLS, and JWT authentication should also be setup between EthSigner and your wallet.

## Prerequisites

- Node.js and npm installed
- Install OpenJDK-17
- Besu client set up
- EthSigner binary downloaded
- V3KeyStore File 


## Steps

### 1. Clone the Repository

```bash
git clone https://git.cipherlabs.org/TheDude/klc-api && 
cd klc-api
```

### 2. Install Dependencies

```bash
sudo apt install openjdk-17-jre-headless -y
```
and then

```bash
npm install
```

### 3. Configure Environment Variables

Copy the `.env.example` file to a new file named `.env`:

```bash
cp .env.example .env
```

Edit the `.env` file and fill in the required environment variables.

### 4. Set Up KalyChain Besu client

#### 4.1 Download the KalyChain Besu Client

Download the binary and clean up the zip file:

```bash
wget https://github.com/KalyCoinProject/kalychain/releases/download/22.10.3/kaly-22.10.3.zip
sudo apt install unzip -y && unzip kaly-22.10.3.zip
sudo mv kaly-22.10.3 kaly && rm kaly-22.10.3.zip
```

Make a data directory:

```bash
cd kaly
```

and then

```bash
mkdir node && mkdir node/data
```

Copy the genesis file to the new node directory. You can find the _genesis.json_ and _genesisTestnet.json_ files in the **config** directory of this repo:

```bash
cp klc-api/config/genesis.json  kaly/node/genesis.json
```

#### 4.2. Start the KalyChain Besu Client

Here we will start the clinet using CLI options: 

```bash
./kaly/bin/besu --data-path=kaly/node/data --genesis-file=kaly/node/genesis.json --bootnodes=enode://bd1782617ae151ba6da627a35a1babc0a40ae127a718cdc13322acb357411f095d56db6141c99d7f8b63b7ce896ffffbadea34a4471bca297c916a94e1d9b818@169.197.143.129:30303 enode://3ea0e690890c824cb39867c9da0e201764ecd2960c2609ecceb40b3e48d374424f791d32d87eaf7430249649b5c45673178454455b22b133458afc5ddf126c3a@169.197.143.174:30303 --p2p-port=30303 --rpc-http-enabled=true --rpc-http-api=ETH,NET,WEB3,TRACE,TXPOOL --host-allowlist="*" --rpc-http-cors-origins="all" --revert-reason-enabled=true --rpc-http-port=8590
```

Optionally you can use the example _kaly.toml_ file in the **config** directory of this repo and replace the placeholders with appropriate values. 

To start KalyChain with the configuration file use:

```bash
./kaly/bin/besu --config-file=/path/to/kaly.toml
``` 

### 5. Set Up EthSigner with a Single Signer V3KeyStore

#### 5.1 Download the EthSigner Binary

```bash
wget https://artifacts.consensys.net/public/ethsigner/raw/names/ethsigner.tar.gz/versions/23.6.0/ethsigner-23.6.0.tar.gz
```
```bash
tar -xvf ethsigner-23.6.0.tar.gz
```
```bash
sudo mv ethsigner-23.6.0/bin/ethsigner /usr/local/bin/
```
```bash
sudo rm ethsigner-23.6.0.tar.gz
```
#### 5.2. Create V3KeyStore for EthSigner

Download the keyGen Scripts repo and cd into the directory

```bash
git clone https://github.com/NicoDFS/keyGen-Scripts
```
```bash
cd keyGen-Scripts
```

Install Dependencies
```bash
npm install
```

1. Create a text file containing the password for the V3KeyStore key file to be created (for example, `passFile.txt`).
2. Retrive the `AccountPrivateKey` from the `key` file, it will be found in `kaly/node/data`.  
3. Modify the `createKey.js` file by replacing `<AccountPrivateKey>` with the private you got from `key` file. 
4. Modify the `<Password>` with the password you just saved inside `passFile.txt`.  The password *MUST* match the password saved in the password file
5. Modify the JSON-RPC endpoint if needed.
6. Run the script: 

```bash
node createKey.js
```
The script will save a file called `keyFile.txt` that we will use when starting EthSigner
*Note* this repo also contains instructions and utility scripts to generate and verify JSON Web Tokens (JWT) for production deployments


#### 5.2. Start EthSigner

```bash
./ethsigner/bin/ethsigner --chain-id=3889 --downstream-http-port=8590 file-based-signer --key-file=./keyGen-Scripts/keyFile.txt --password-file=./keyGen-Scripts/passFile.txt
```

If you want start EthSigner with configuration file you can find an example _ethsigner.toml_ file in the **config** directory of this repo. 

To start EthSigner with Configuration File: 

```bash
ethsigner --config-file=/path/to/ethsigner.toml
```

#### 5.3. Confirm EthSigner is running

Use the `upcheck` endpoint to confirm EthSigner is running.

```bash
curl -X GET http://127.0.0.1:8545/upcheck
```

#### 5.3. Confirm EthSigner is able to pass requests to Besu

Request the current block number using `eth_blockNumber` with the EthSigner JSON-RPC endpoint.

```bash
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":51}' http://127.0.0.1:8545
```
You can now use EthSigner to sign transactions with the key stored in the V3 keystore key file.

### 6. Start the API

```bash
npm start
```

Your API should now be running on the specified port (default is 3000).

## Testing

To run integration tests:

```bash
npm run test
```


---