import * as dotenv from 'dotenv'
import { foundry } from "viem/chains";
import {
  type Address,
  getAddress,
  numberToHex,
  hashMessage,
  parseEther,
  parseGwei,
  parseTransaction,
  hexToNumber,
  recoverAddress,
  stringToHex,
  verifyTypedData,
  type EIP1474Methods,
  keccak256,
  ProviderDisconnectedError,
  MethodNotSupportedRpcError,
  serializeTransaction,
} from "viem";

import {
  beforeAll,
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
  jest,
} from "@jest/globals";
import type { BuildervaultWeb3Provider, BuildervaultProviderConfig } from "../types";

import { createEIP1193Provider } from "../";
import type { AddEthereumChainParameter } from "viem";
import { formatEther, getHttpRpcClient } from "viem/utils";

dotenv.config()

const RECEIVER_ADDRESS: Address = "0x6f85Eb534E14D605d4e82bF97ddF59c18F686699";
const ANVIL_RPC_URL = "http://127.0.0.1:8545";
const EXPECTED_ADDRESS_DEFAULT_BALANCE_ETH = "100"; //ETH
const anvilPublicClient = getHttpRpcClient(ANVIL_RPC_URL);

if ( !process.env.BUILDERVAULT_PLAYER_COUNT || !process.env.BUILDERVAULT_MASTERKEY_ID || !process.env.BUILDERVAULT_ACCOUNT_ID
   || !process.env.BUILDERVAULT_ADDRESS_INDEX
  || !process.env.BUILDERVAULT_PLAYER0_URL) {
  throw new Error("ENVs required");
}

let buildervaultProviderConfig: BuildervaultProviderConfig = {
  playerCount: Number(process.env.BUILDERVAULT_PLAYER_COUNT),
  masterKeyId: process.env.BUILDERVAULT_MASTERKEY_ID,
  accountId: Number(process.env.BUILDERVAULT_ACCOUNT_ID),
  addressIndex: Number(process.env.BUILDERVAULT_ADDRESS_INDEX),
  chains: [
    {
      chainId: "0x7a69",
      rpcUrls: ["http://127.0.0.1:8545"] as const,
      chainName: "Foundry",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
    },
  ]
};

if (process.env.BUILDERVAULT_PLAYER_COUNT){

  for (let i = 0; i < Number(process.env.BUILDERVAULT_PLAYER_COUNT); i++) {

    if (!process.env[`BUILDERVAULT_PLAYER${i}_URL`]){
      throw new Error(`BUILDERVAULT_PLAYER${i}_URL is required`)
    } else {

      if (process.env[`BUILDERVAULT_PLAYER${i}_URL`]){
        buildervaultProviderConfig = {
          ...buildervaultProviderConfig,
          [`player${i}Url`] : process.env[`BUILDERVAULT_PLAYER${i}_URL`] as string
        }
      }

      if (process.env[`BUILDERVAULT_PLAYER${i}_MPCPUBLICKEY`]) {
        buildervaultProviderConfig = {
          ...buildervaultProviderConfig,
          [`player${i}MPCpublicKey`]: process.env[`BUILDERVAULT_PLAYER${i}_MPCPUBLICKEY`] as string
        };
      }

      if (process.env[`BUILDERVAULT_PLAYER${i}_APIKEY`]) {
        buildervaultProviderConfig = {
          ...buildervaultProviderConfig,
          [`player${i}ApiKey`]: process.env[`BUILDERVAULT_PLAYER${i}_APIKEY`] as string
        };
      }

      if (process.env[`BUILDERVAULT_PLAYER${i}_MTLSPUBLICKEY`]) {
        buildervaultProviderConfig = {
          ...buildervaultProviderConfig,
          [`player${i}mTLSpublicKey`]: process.env[`BUILDERVAULT_PLAYER${i}_MTLSPUBLICKEY`] as string
        };
      }

      if (process.env[`BUILDERVAULT_PLAYER${i}_CLIENT_CERT`]) {
        buildervaultProviderConfig = {
          ...buildervaultProviderConfig,
          [`player${i}ClientCert`]: process.env[`BUILDERVAULT_PLAYER${i}_CLIENT_CERT`] as string,
          [`player${i}ClientKey`]: process.env[`BUILDERVAULT_PLAYER${i}_CLIENT_KEY`] as string
        };
      }
    }
  }
}

let expectedWalletAddress: Address;

const anvil = {
  /**
   * Sets the balance of an address on the anvil test net
   * @param address - the target address to set the balance; default WALLET_ACCOUNT_ETH_ADDRESS
   * @param balance (ETH) - the balance to set in ETH; default 100ETH
   */

  async setBalance(
    address: Address = expectedWalletAddress,
    balance: string = EXPECTED_ADDRESS_DEFAULT_BALANCE_ETH
  ) {
    await anvilPublicClient.request({
      body: {
        method: "anvil_setBalance",
        params: [address, numberToHex(parseEther(balance))],
        id: 0,
      },
    });
  },
  /**
   * Resets the `address` nonce to 0
   * @param address - the address to reset; default WALLET_ACCOUNT_ETH_ADDRESS
   */
  async resetNonce(address: Address = expectedWalletAddress) {
    await anvilPublicClient.request({
      body: {
        method: "anvil_setNonce",
        params: [address, "0x0"],
        id: 0,
      },
    });
  },
};

describe("Test BuilderVault EIP-1193 Provider", () => {
  let eip1193Provider: BuildervaultWeb3Provider;

  const foundryChain = {
    chainName: foundry.name,
    chainId: numberToHex(foundry.id),
    rpcUrls: [ANVIL_RPC_URL],
  };

  beforeAll(async () => {
    // Sets the initial balance
    // Balance is reset after each test
    const eip1193Provider = await createEIP1193Provider(buildervaultProviderConfig);
    const accounts: Address[] = await eip1193Provider.request({
      method: "eth_requestAccounts",
    });
    expectedWalletAddress = accounts[0];
    anvil.setBalance();
  });

  beforeEach(async () => {
    eip1193Provider = await createEIP1193Provider(buildervaultProviderConfig);
  });

  afterEach(() => {
    // Reset the nonce and balance of the expected address
    anvil.setBalance();
    anvil.resetNonce();
  });

  const getEIP1193Provider = (
    chain: AddEthereumChainParameter = foundryChain
  ) =>
    createEIP1193Provider(buildervaultProviderConfig);

  describe("Connectivity Logic", () => {
    it("should emit connected when successfully connected", async () => {
      const provider = await getEIP1193Provider();
      const onConnected = jest.fn();
      provider.on("connect", (connectionInfo) => {
        expect(connectionInfo.chainId).toEqual(foundryChain.chainId);
        onConnected();
      });

      await provider.request({ method: "eth_blockNumber" });

      expect(onConnected).toHaveBeenCalled();
    });

    // it("should emit disconnected when connectivity is lost", async () => {
    //   // Define a chain configuration with a valid RPC URL initially
    //   // Performs a deep clone since we need to modify the rpcUrls
    //   const chain = JSON.parse(JSON.stringify(foundryChain));
    //   // Create an EIP1193 provider instance configured for the specified chain
    //   const provider = await getEIP1193Provider(chain);

    //   // Setup a mock function to track the 'disconnect' event
    //   const onDisconnected = jest.fn();
    //   provider.on("disconnect", (error) => {
    //     expect(error).toBeInstanceOf(ProviderDisconnectedError); // Assert that the error is an instance of ProviderDisconnectedError
    //     onDisconnected(); // Record the disconnect event occurrence
    //   });

    //   // Change the RPC URL to an invalid one to simulate connectivity loss
    //   chain.rpcUrls[0] = "https://invalid.rpc.url";

    //   // Attempt to make a request which should fail due to the invalid RPC URL
    //   await provider.request({ method: "eth_blockNumber" }).catch(() => {});

    //   expect(onDisconnected).toHaveBeenCalledTimes(1);
    // });

    it("should not emit connected if already connected", async () => {
      const provider = await getEIP1193Provider();
      const onConnected = jest.fn();
      provider.on("connect", onConnected);

      // Assuming the provider is already connected from previous tests
      await provider.request({ method: "eth_blockNumber" });

      // The connected event should not be called again since it's already connected
      expect(onConnected).not.toHaveBeenCalledTimes(2);
    });

    // it("should not emit disconnected if already disconnected", async () => {
    //   // Define a chain configuration with a valid RPC URL initially
    //   // Performs a deep clone since we need to modify the rpcUrls
    //   const chain = JSON.parse(JSON.stringify(foundryChain));

    //   // Create an EIP1193 provider instance configured for the specified chain
    //   const provider = await getEIP1193Provider(chain);

    //   // Setup a mock function to track the 'disconnect' event
    //   const onDisconnected = jest.fn();
    //   provider.on("disconnect", (error) => {
    //     expect(error).toBeInstanceOf(ProviderDisconnectedError);
    //     onDisconnected();
    //   });

    //   // Change the RPC URL to an invalid one to simulate connectivity loss
    //   chain.rpcUrls[0] = "https://invalid.rpc.url";

    //   // First call to simulate initial connectivity loss
    //   await provider.request({ method: "eth_blockNumber" }).catch(() => {});

    //   // Second call to simulate subsequent check while already disconnected
    //   await provider.request({ method: "eth_blockNumber" }).catch(() => {});

    //   // The disconnected event should not be called again since it's already disconnected
    //   expect(onDisconnected).toHaveBeenCalledTimes(1);
    // });
  });

  // This section of tests is dedicated to verifying the functionality of the BuilderVault EIP-1193 Provider.
  // It includes tests for supported wallet methods such as account retrieval and signing,
  // as well as public RPC methods like retrieving the current block number and chain ID.
  // Additionally, it tests for the proper handling of unsupported methods, ensuring they throw the expected errors.
  describe("Test EIP-1193 Provider Methods", () => {
    describe("Supported Methods", () => {
      describe("EIP-1193 Wallet Methods", () => {
        describe("eth_requestAccounts", () => {
          it("should request accounts associated with the user's wallet", async () => {
            const accounts = await eip1193Provider.request({
              method: "eth_requestAccounts",
            });
            expect(accounts).not.toBeUndefined();
            expect(Array.isArray(accounts)).toBeTruthy();
            expect(accounts).toHaveLength(10);
          });
        });
        describe("eth_accounts", () => {
          // it("get accounts should be empty if 'eth_requestAccounts' has not been called", async () => {
          //   const accounts = await eip1193Provider?.request({
          //     method: "eth_accounts",
          //   });
          //   expect(accounts).not.toBeUndefined();
          //   expect(Array.isArray(accounts)).toBeTruthy();
          //   expect(accounts.length).toBe(0);
          // });
          it("should get accounts associated with the user's wallet", async () => {
            await eip1193Provider.request({
              method: "eth_requestAccounts",
            });
            const accounts = await eip1193Provider?.request({
              method: "eth_accounts",
            });
            expect(accounts).not.toBeUndefined();
            expect(Array.isArray(accounts)).toBeTruthy();
            expect(accounts.length).toBeGreaterThan(0);
            expect(accounts).toContain(expectedWalletAddress);
          });
        });
        describe("eth_sign", () => {
          it("should sign a message", async () => {
            const messageDigest = stringToHex("A man, a plan, a canal, Panama");
            const signerAddress = expectedWalletAddress;
            const signature = await eip1193Provider?.request({
              method: "eth_sign",
              params: [signerAddress, messageDigest],
            });
            expect(signature).not.toBeUndefined();
            expect(signature).not.toBe("");
            const address = await recoverAddress({
              hash: hashMessage({ raw: messageDigest }),
              signature: signature!,
            });
            expect(getAddress(address)).toBe(getAddress(signerAddress));
            expect(signature).toMatch(/^0x.*$/);
          });
        });
        describe("personal_sign", () => {
          it("should sign a message", async () => {
            const messageDigest = stringToHex("A man, a plan, a canal, Panama");
            const signerAddress = expectedWalletAddress;
            const signature = await eip1193Provider?.request({
              method: "personal_sign",
              params: [messageDigest, signerAddress],
            });
            expect(signature).not.toBeUndefined();
            expect(signature).not.toBe("");
            const address = await recoverAddress({
              hash: hashMessage({ raw: messageDigest }),
              signature: signature!,
            });
            expect(getAddress(address)).toBe(getAddress(signerAddress));
            expect(signature).toMatch(/^0x.*$/);
          });
        });
        describe("eth_signTypedData_v4", () => {
          it("should sign typed data according to EIP-712", async () => {
            const signerAddress = expectedWalletAddress;
            // Test typed data signing (EIP-712)
            // All properties on a domain are optional
            const domain = {
              name: "Ether Mail",
              version: "1",
              chainId: 1,
              verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
            } as const;

            // The named list of all type definitions
            const types = {
              Person: [
                { name: "name", type: "string" },
                { name: "wallet", type: "address" },
              ],
              Mail: [
                { name: "from", type: "Person" },
                { name: "to", type: "Person" },
                { name: "contents", type: "string" },
              ],
            } as const;
            const primaryType = "Mail";
            const message = {
              from: {
                name: "Cow",
                wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
              },
              to: {
                name: "Bob",
                wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
              },
              contents: "Hello, Bob!",
            } as const;
            const typedData = {
              signerAddress,
              domain,
              types,
              primaryType,
              message,
            } as const;

            const signature = await eip1193Provider?.request({
              method: "eth_signTypedData_v4",
              params: [signerAddress, typedData],
            });

            const valid = await verifyTypedData({
              address: signerAddress,
              domain,
              types,
              primaryType,
              message,
              signature,
            });

            expect(valid).toBeTruthy();
            expect(signature).not.toBeNull();
            expect(signature).not.toBe("");
            expect(signature).toMatch(/^0x[a-fA-F0-9]+$/);
          });
        });
        describe("eth_signTransaction", () => {
          it("should sign a transaction", async () => {
            const from = expectedWalletAddress;
            const to = RECEIVER_ADDRESS;

            const signedTransaction = await eip1193Provider?.request({
              method: "eth_signTransaction",
              params: [
                {
                  from,
                  to,
                  value: numberToHex(parseEther("0.001")),
                  chainId: numberToHex(foundry.id),
                  nonce: numberToHex(0),
                  gas: numberToHex(21000n),
                  maxFeePerGas: numberToHex(parseGwei("20")),
                  maxPriorityFeePerGas: numberToHex(parseGwei("2")),
                  //type: "0x2",
                }
              ],
            });

            expect(signedTransaction).toBeDefined();
            expect(signedTransaction).not.toBe("");
            expect(signedTransaction).toMatch(/^0x[a-fA-F0-9]+$/);

            const deserializedTransaction = parseTransaction(signedTransaction);

            const signature = {
              r: deserializedTransaction.r!,
              s: deserializedTransaction.s!,
              v: deserializedTransaction.v!,
              yParity: deserializedTransaction.yParity!,
            };

            const deserializedUnsignedTransaction = serializeTransaction({
              ...deserializedTransaction,
              r: undefined,
              s: undefined,
              v: undefined,
              yParity: undefined,
              sidecars: undefined,
            });
          
            const recoveredAddress = await recoverAddress({
              hash: keccak256(deserializedUnsignedTransaction),
              signature,
            });

            expect(recoveredAddress).toMatch(expectedWalletAddress);

          });
        });
        describe("eth_sendTransaction", () => {
          it("should sign and send a transaction", async () => {

            console.log(
              "Balance before transaction:",
              hexToNumber(
                await eip1193Provider?.request({
                  method: "eth_getBalance",
                  params: [expectedWalletAddress, "latest"],
                }),
              ),
            );
            const from = expectedWalletAddress;
            const to = RECEIVER_ADDRESS;
            const value = numberToHex(parseEther("0.001"));
            const chainId = numberToHex(foundry.id);
            const nonce = await eip1193Provider.request({
              method: "eth_getTransactionCount",
              params: [from, "latest"],
            });
            const gas = numberToHex(21000n);
            const maxFeePerGas = numberToHex(parseGwei("20"));
            const maxPriorityFeePerGas = numberToHex(parseGwei("2"));
            const transactionType = "0x2";
            const transactionHash = await eip1193Provider.request({
              method: "eth_sendTransaction",
              params: [
                {
                  from,
                  to,
                  value,
                  chainId,
                  nonce,
                  gas,
                  maxFeePerGas,
                  maxPriorityFeePerGas,
                  type: transactionType,
                },
              ],
            });

            expect(transactionHash).toBeDefined();
            expect(transactionHash).toMatch(/^0x[a-fA-F0-9]+$/);

            // Optionally, you can wait for the transaction to be mined and then perform assertions on the receipt
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const receipt = await eip1193Provider.request({
              method: "eth_getTransactionReceipt",
              params: [transactionHash],
            });

            expect(receipt).toBeDefined();
            expect(receipt?.status).toBe("0x1"); // Success status
          });
        });
        describe("web3_clientVersion", () => {
          it("should return the version of the client matching package.json version", async () => {
            const pkg = await import("./../../package.json");
            const version = await eip1193Provider?.request({
              method: "web3_clientVersion",
            });
            const expectedVersion = `${pkg.name}@${pkg.version}`;
            expect(version).toBeDefined();
            expect(version).toBe(expectedVersion);
          });
        });
      });

      describe("Public RPC Methods", () => {
        describe("eth_chainId", () => {
          it("should get the correct chain id using the underlying RPC provider", async () => {
            const chainId = await eip1193Provider?.request({
              method: "eth_chainId",
            });
            expect(chainId).not.toBeUndefined();
            expect(chainId).toMatch(/^0x.*$/);
            expect(parseInt(chainId!, 16)).toBe(foundry.id);
          });
        });
        describe("eth_getBalance", () => {
          it("should get the correct chain id using the underlying RPC provider", async () => {
            const balance = await eip1193Provider?.request({
              method: "eth_getBalance",
              params: [expectedWalletAddress, "latest"],
            });
            expect(balance).not.toBeUndefined();
            expect(balance).toMatch(/^0x.*$/);
            expect(formatEther(BigInt(balance))).toBe(
              EXPECTED_ADDRESS_DEFAULT_BALANCE_ETH
            );
          });
        });
        describe("eth_getBlockByNumber", () => {
          it("should get blocknumber using the underlying RPC provider", async () => {
            const blockNumber = await eip1193Provider?.request({
              method: "eth_blockNumber",
            });
            expect(blockNumber).not.toBeUndefined();
            expect(blockNumber).not.toBe("");
            expect(blockNumber).toMatch(/^0x.*$/);
          });
        });
      });
    });
    describe("Unsupported Methods", () => {
      const unsupportedMethods = [
        "wallet_getPermissions",
        "wallet_requestPermissions",
        "wallet_revokePermissions",
        "wallet_registerOnboarding",
        "wallet_watchAsset",
        "wallet_scanQRCode",
        "wallet_getSnaps",
        "wallet_requestSnaps",
        "wallet_snap",
        "wallet_invokeSnap",
        "eth_decrypt",
        "eth_getEncryptionPublicKey",
      ];

      unsupportedMethods.forEach((method) => {
        it(`should throw a Method not supported error for ${method}`, async () => {
          await expect(
            eip1193Provider?.request({
              method: method as EIP1474Methods[0]["Method"],
            })
          ).rejects.toThrow(MethodNotSupportedRpcError);
        });
      });
    });
  });
});
