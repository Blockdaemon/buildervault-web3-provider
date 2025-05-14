# Blockdaemon BuilderVault Web3 Provider

Blockdaemon BuilderVault [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) Compatible Ethereum JavaScript Provider

## Installation
```bash
npm config set @sepior:registry=https://gitlab.com/api/v4/projects/56306653/packages/npm/   # Builder Vault nodejsSDK public repository
npm config set @blockdaemon:registry=https://npm.pkg.github.com/        # Builder Vault Web3 provider nodejsSDK private repository
npm config set //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
npm install @blockdaemon/buildervault-web3-provider
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

## Usage with ethers.js
```sh
npm install ethers@6
```

```js
import * as ethers from "ethers"

const provider = new ethers.BrowserProvider(eip1193Provider);
```

## API Documentation

### BuildervaultProviderConfig

```ts
export type BuildervaultProviderConfig = {
  // ------------- Mandatory fields -------------
  /** 
   * Set the numnber of the BuilderVault players
   */
  playerCount?: number
  /** 
   * Set the URL of each BuilderVault player endpoint
   */
  player0Url?: string,
  player1Url?: string,
  player2Url?: string,
  /**
   * Set the BuilderVault TSM API keys or use Client Certificate authentication
   */
  player0ApiKey?: string,
  player1ApiKey?: string,
  player2ApiKey?: string,
  /** 
   * Set the BuilderVault TSM mTLS Client Authentication Certficate key pair or use API Key authentication
   */
  player0ClientCert?: string,
  player0ClientKey?: string,
  player1ClientCert?: string,
  player1ClientKey?: string,
  player2ClientCert?: string,
  player2ClientKey?: string,
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
   * Set the MPC publickey of each BuilderVault player. This is required for Dynamic communication between nodes such as through a broker and not static communication
   */
  player0MPCpublicKey?: string,
  player1MPCpublicKey?: string,
  player2MPCpublicKey?: string,
  /**
  /** 
   * Set the TLS publickey of each BuilderVault player endpoint. This is used for mTLS server certificate pinning.
   */
  player0mTLSpublicKey?: string,
  player1mTLSpublicKey?: string,
  player2mTLSpublicKey?: string,
  /** 
   * Set the list of Ethereum chains to be used with this provider (type AddEthereumChainParameter[] compatible with EIP-3085)
   */
  chains: [
    {
      chainId: "0x1",
      rpcUrls: ["https://svc.blockdaemon.com/native/v1/ethereum/mainnet?apiKey=zpka_853...b25"] as const,
      chainName: "Ethereum Mainnet",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
    },
  ]
}
```

### Viem full client example
```ts
import { createEIP1193Provider } from "@blockdaemon/buildervault-web3-provider";
import { createWalletClient, custom } from 'viem';
import { holesky } from 'viem/chains';

const chain = {
  chainName: "Ethereum Holesky",
  chainId: "0x4268",
  rpcUrls: ["https://svc.blockdaemon.com/native/v1/ethereum/holesky?apiKey=zpka_853...b25"],
};

async function main() {

  const eip1193Provider = await createEIP1193Provider({
      chains: [chain],
      playerCount: 2,
      player0Url: "http://localhost:8500",
      player0ApiKey: "apikey0",
      player1Url: "http://localhost:8501",
      player1ApiKey: "apikey1",
      masterKeyId: "Ap7fC2YPwBKbRXwVHEBVUkHYF37G",
      accountId: 0,   // account of BIP44 m/44/60/account/0/address_index
      addressIndex: 0, // address_index of BIP44 m/44/60/account/0/address_index
  });

  const walletClient = createWalletClient({ 
    chain: holesky,
    transport: custom({
      async request({ method, params }) {
        const response = await eip1193Provider.request({method, params})
        return response
      }
    })
  });

  walletClient.requestAddresses().then(console.log);

}

main();
```