# Blockdaemon BuilderVault Web3 Provider

Blockdaemon BuilderVault [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) Compatible Ethereum JavaScript Provider

## Installation
```bash
npm config set @sepior:registry=https://gitlab.com/api/v4/projects/56306653/packages/npm/   # Builder Vault nodejsSDK repository
npm install @blockdaemon/buildervault-web3-provider
```

## Usage with ethers.js
```sh
npm install ethers@6
```

```js
import * as ethers from "ethers"

const provider = new ethers.BrowserProvider(eip1193Provider);
```

## Usage with web3.js
```sh
npm install web3
```

```js
import Web3 from "web3";

const web3 = new Web3(eip1193Provider);
```

## Usage with viem.sh
```sh
npm install viem
```
```js
import { createWalletClient, custom } from 'viem'

const walletClient = createWalletClient({ 
  transport: custom({
    async request({ method, params }) {
      const response = await eip1193Provider.request({method, params})
      return response
    }
  })
})
```


## API Documentation

### BuildervaultProviderConfig

```ts
type BuildervaultProviderConfig = {
  // ------------- Mandatory fields -------------
  /** 
   * Set the RPC API URL endpoint for JSON-RPC over HTTP access to the blockchain data
   */
  rpcUrl?: string,
  /** 
   * Set the URL of the BuilderVault player0 and player1 endpoints
   */
  player0Url?: string,
  player1Url?: string,
  /** 
   * Set the BuilderVault TSM API keys
   */
  player0ApiKey?: string,
  player1ApiKey?: string,
  /** 
   * BuilderVault Master Key ID. This ID represents all the private Master Key shares and must be generated outside if the web3 provider using the BuilderVault SDK
   */
  masterKeyId?: string,
  /** 
   * It is recommended to provide the account id explicitly.
   * This represents the <account> in the BIP44 chain path m/44/60/account/0/address_index
   */
  accountId?: number,
  /** 
   * By default, the first 5 addresses are derived from the master key
   * It is recommended to provide the address index explicitly.
   * This represents the <address_index> in the BIP44 chain path  m/44/60/account/0/address_index
   */
  addressIndex?: number,

  // ------------- Optional fields --------------
  /**
   * Default: false
   * By setting to true, every request and response processed by the provider will be logged to the console
   * Same as setting env var `DEBUG=buildervault-web3-provider:req_res`
   */
  logRequestsAndResponses?: boolean
}
```

### Web3.js full client example
```ts
import { BuildervaultWeb3Provider } from "@blockdaemon/buildervault-web3-provider";
import Web3 from "web3";

const eip1193Provider = new BuildervaultWeb3Provider({
  rpcUrl: "https://svc.blockdaemon.com/native/v1/ethereum/holesky?apiKey=zpka_...",
  player0Url: "http://localhost:8500",
  player0ApiKey: "apikey...",
  player1Url: "http://localhost:8501",
  player1ApiKey: "apikey...",
  masterKeyId: "Ap3...",
  accountId: 0,   // account of BIP44 m/44/60/account/0/address_index
  addressIndex: 0, // address_index of BIP44 m/44/60/account/0/address_index
  logRequestsAndResponses: false,  // Verbose logging
})

async function main() {

  const web3 = new Web3(eip1193Provider);

  const chainId = await web3.eth.getChainId();
  console.log(`ChainID:`, chainId);

  const accounts = await web3.eth.getAccounts();
  console.log(`Wallet addresses:`, accounts);

  console.log(`Initial balance for address_index 0:`, await web3.eth.getBalance(accounts[0]));

  const feeData = await web3.eth.calculateFeeData();

  // Construct the transaction
  const transaction = {
    chainId: chainId,
    from: accounts[0],
    to: '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe',
    value: '1000000000000',
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
  }

  // Sign the transaction with BuilderVault, broadcast and wait for the receipt
  const receipt = await web3.eth.sendTransaction(transaction);

  // Log the transaction receipt
  console.log('Transaction receipt:', receipt);

  // Log final balances after the transaction has been mined
  console.log(`Final balance for address_index 0:`, await web3.eth.getBalance(accounts[0]));

}

main();
```