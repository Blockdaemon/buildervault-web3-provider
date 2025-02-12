import { TSMClient, Configuration, SessionConfig } from "@sepior/tsmsdkv2";
import {
  type Address,
  type EIP1193Provider,
  ProviderRpcError,
  RpcRequestError,
  type WalletRpcSchema,
  type TypedDataDefinition,
  type AddEthereumChainParameter,
  MethodNotSupportedRpcError,
  ProviderDisconnectedError,
  ChainDisconnectedError,
  Hex,
  hexToBytes,
  hashMessage,
  keccak256,
  serializeTransaction,
  serializeSignature,
  Signature
} from "viem";
import { getHttpRpcClient, hashTypedData } from "viem/utils";
import crypto from "crypto";
import EventEmitter from "events";
import { preprocessTransaction, validateChain } from "./utils";
import type {
  ConnectInfo,
  BuildervaultWeb3Provider,
  BuildervaultProviderConfig,
} from "./types";

import {
  getWalletAccounts,
  signMessage,
  //buildervaultIsDisconnected,
} from "./provider";

import { ChainIdMismatchError, UnrecognizedChainError } from "./errors";
import { VERSION } from "./version";

export const createEIP1193Provider = async (
  options: BuildervaultProviderConfig
) => {
  const { playerCount, masterKeyId, accountId, player0MPCpublicKey, chains} = options;
  let TSMClients: TSMClient[] = [];
  let sessionConfig: SessionConfig;
  //let createError: (error: { message: string }) => Error;
  const accountsAddresses: Set<Address> = new Set();
  let addressIndex: number;
  if (!options.addressIndex) {
    addressIndex = 0;
  }

  // Used for public RPC requests
  let id = 0;

  // `activeChain` holds the current Ethereum chain that the provider is operating on to.
  // It is set when the provider successfully switches to a new chain via `wallet_switchEthereumChain`
  // or adds a new chain with `wallet_addEthereumChain`. This variable is crucial for ensuring that
  // the provider operates with the correct chain context, including chain ID and RPC URLs.
  let activeChain: AddEthereumChainParameter;
  let addedChains: (AddEthereumChainParameter & { connected: boolean })[] = [];

  // Initialize eventEmitter with a Proxy directly
  const eventEmitter = new EventEmitter();

  // `isInitialized` indicates that the provider is setup and ready to use.
  // Used to skip setting connected for the initial RPC requests.
  let isInitialized = false;

  let lastEmittedEvent: "connect" | "disconnect";

  const asyncInitializeTSMClient = async () => {
    // For each player create an authenticated TSMClient
    for (let i = 0; i < playerCount; i++) {
      // Construct the dynamic keys
      const playerUrlKey = `player${i}Url`;
      const playerApiKeyKey = `player${i}ApiKey`;
      const playerClientCertKey = `player${i}ClientCert`;
      const playerClientKeyKey = `player${i}ClientKey`;
      const playerMTLSpublicKeyKey = `player${i}mTLSpublicKey`;
    
      // Check if required properties are defined
      const playerUrl = options[playerUrlKey as keyof BuildervaultProviderConfig];
      if (!playerUrl) {
        throw new Error(`${playerUrlKey} is required`);
      }
  
      const playerApiKey = options[playerApiKeyKey as keyof BuildervaultProviderConfig];
      const playerClientCert = options[playerClientCertKey as keyof BuildervaultProviderConfig];
      const playerClientKey = options[playerClientKeyKey as keyof BuildervaultProviderConfig];
      const playerMTLSpublicKey = options[playerMTLSpublicKeyKey as keyof BuildervaultProviderConfig];
  
      // Use properties (playerUrl, playerApiKey, etc.) as needed in your configuration logic
      const playerConfig = await new Configuration(playerUrl as string);
  
      if (playerApiKey) {
          await playerConfig.withAPIKeyAuthentication(playerApiKey as string);
      } else if (playerClientCert && playerClientKey && playerMTLSpublicKey) {
        const cert = new crypto.X509Certificate(playerMTLSpublicKey as string);

        await playerConfig.withPublicKeyPinning(cert.publicKey.export({type: "spki",format: "der"}));

        await playerConfig.withMTLSAuthentication(
          playerClientKey as string,
          playerClientCert as string,
          false, "", "", "", ""
        );
      } else {
        throw new Error(`player${i} authentication credentials are required`);
      }

      TSMClients.push(await TSMClient.withConfiguration(playerConfig));
    }

    // If player MPC publickeys are defined construct new Dynamic SessionConfig
    if (player0MPCpublicKey) {
      const playerPubkeys = [];
      const playerIds = new Uint32Array(Array(TSMClients.length).fill(0).map((_, i) => i));
      for (let i = 0; i < playerCount; i++) {
        const playerMPCpublicKeyKey = `player${i}MPCpublicKey`;
        const playerMPCpublicKey = options[playerMPCpublicKeyKey as keyof BuildervaultProviderConfig];
        const playerMPCpublicKeyBytes = Buffer.from(
          playerMPCpublicKey as string, "base64"
        )
        playerPubkeys.push(playerMPCpublicKeyBytes)
      }
      sessionConfig = await SessionConfig.newSessionConfig(
        await SessionConfig.GenerateSessionID(),
        playerIds,
        playerPubkeys
      );
    // If player MPC publickeys are not defined construct new Static SessionConfig
    } else {
      sessionConfig = await SessionConfig.newStaticSessionConfig(
        await SessionConfig.GenerateSessionID(),
        TSMClients.length
      );
    }

    // set initialized to true
    //isInitialized = true;
  };

  await asyncInitializeTSMClient();

  function setConnected(connected: true, data: ConnectInfo): void;
  function setConnected(connected: false, data: ProviderRpcError): void;
  function setConnected(
    connected: boolean,
    data: ConnectInfo | ProviderRpcError
  ) {
    if (!isInitialized) return;

    // Find the currently selected chain and update its connected status
    addedChains = addedChains.map((chain) =>
      chain.chainId === activeChain.chainId ? { ...chain, connected } : chain
    );
    if (connected && lastEmittedEvent !== "connect" && isInitialized) {
      // Emit 'connect' event when the provider becomes connected as per EIP-1193
      // See https://eips.ethereum.org/EIPS/eip-1193#connect
      eventEmitter.emit("connect", data);
      lastEmittedEvent = "connect";
    } else if (
      addedChains.every(({ connected }) => !connected) &&
      lastEmittedEvent !== "disconnect"
    ) {
      // Emit 'disconnect' event when disconnected from all chains
      // See https://eips.ethereum.org/EIPS/eip-1193#disconnect
      const providerDisconnectedError = new ProviderDisconnectedError(
        data as ProviderRpcError
      );
      eventEmitter.emit("disconnect", providerDisconnectedError);
      // Reset 'connect' emitted flag on disconnect
      lastEmittedEvent = "disconnect";
      throw providerDisconnectedError;
    } else if (!connected) {
      // Provider is disconnected from currentChain but connected to at least 1 other chain
      // Provider is still considered 'connected' & we don't emit unless all chains disconnected
      // See https://eips.ethereum.org/EIPS/eip-1193#provider-errors
      throw new ChainDisconnectedError(data as ProviderRpcError);
    }
  }

  // Get wallet account addresses
  let walletAccounts = await getWalletAccounts(
    TSMClients,
    masterKeyId,
    accountId,
    //createError
  );
  Object.values(walletAccounts[accountId]).map((address) => {
    accountsAddresses.add(address as Address)
  });

  const request: BuildervaultWeb3Provider["request"] = async ({
    method,
    params,
  }) => {
    try {
      switch (method) {
        case "web3_clientVersion": {
          return VERSION;
        }

        /**
         * Requests that the user provide an Ethereum address to be identified by.
         * This method is specified by [EIP-1102](https://eips.ethereum.org/EIPS/eip-1102)
         * This method must be called first to establish the connectivity of the client.
         * @returns {Promise<Address[]>} An array of addresses after user authorization.
         */
        case "eth_requestAccounts": {
          setConnected(true, { chainId: activeChain.chainId });
          return [...accountsAddresses];
        }

        /**
         * Returns a list of addresses owned by the user.
         * @returns {Promise<Address[]>} An array of addresses owned by the user.
         */
        case "eth_accounts": {
          setConnected(true, { chainId: activeChain.chainId });
          return [...accountsAddresses];
        }
        case "personal_sign": {
          const [message, signWith] =
            params as WalletRpcSchema[10]["Parameters"];
          
          // Map signWith address to addressIndex
          if (!signWith) {
            throw new Error("signWith is required");
          } else if (!accountsAddresses.has(signWith)) {
            throw new Error("signWith is not a valid address");
          } else {
            addressIndex = [...accountsAddresses].indexOf(signWith);
          }
          const signedMessage = await signMessage(
            TSMClients,
            masterKeyId,
            sessionConfig,
            accountId,
            addressIndex,
            hexToBytes(hashMessage({ raw: message })),
          );
          setConnected(true, { chainId: activeChain.chainId });
          return serializeSignature({ r: signedMessage.r, s: signedMessage.s, v: signedMessage.v });
        }
        case "eth_sign": {
          const [signWith, message] =
            params as WalletRpcSchema[6]["Parameters"];

          // Map signWith address to addressIndex
          if (!signWith) {
            throw new Error("signWith is required");
          } else if (!accountsAddresses.has(signWith)) {
            throw new Error("signWith is not a valid address");
          } else {
            addressIndex = [...accountsAddresses].indexOf(signWith);
          }
          const signedMessage = await signMessage(
            TSMClients,
            masterKeyId,
            sessionConfig,
            accountId,
            addressIndex,
            hexToBytes(hashMessage({ raw: message })),
          );
          setConnected(true, { chainId: activeChain.chainId });
          return serializeSignature({ r: signedMessage.r, s: signedMessage.s, v: signedMessage.v });
        }
        case "eth_signTypedData_v4": {
          const [signWith, typedData] = params as [
            Address,
            TypedDataDefinition
          ];

          // Map signWith address to addressIndex
          if (!signWith) {
            throw new Error("signWith is required");
          } else if (!accountsAddresses.has(signWith)) {
            throw new Error("signWith is not a valid address");
          } else {
            addressIndex = [...accountsAddresses].indexOf(signWith);
          }
          const message = hashTypedData(typedData);
          const signedMessage = await signMessage(
            TSMClients,
            masterKeyId,
            sessionConfig,
            accountId,
            addressIndex,
            hexToBytes(message),
          );
          setConnected(true, { chainId: activeChain.chainId });
          return serializeSignature({ r: signedMessage.r, s: signedMessage.s, v: signedMessage.v });
        }
        case "eth_signTransaction": {
          const [transaction] = params as WalletRpcSchema[7]["Parameters"];

          // Map from address to addressIndex
          if (!transaction.from) {
            throw new Error("from is required");
          } else if (!accountsAddresses.has(transaction.from)) {
            throw new Error("from is not a valid address");
          } else {
            addressIndex = [...accountsAddresses].indexOf(transaction.from);
          }

          const processedTransaction = preprocessTransaction({ ...transaction });

          const serializedUnsignedTransaction = serializeTransaction({
            ...processedTransaction
          });

          const signedMessage: Signature = await signMessage(
            TSMClients,
            masterKeyId,
            sessionConfig,
            accountId,
            addressIndex,
            hexToBytes(keccak256(serializedUnsignedTransaction)),
          );

          const signedTransaction = serializeTransaction({
            ...processedTransaction,
            },
            {
              r: signedMessage.r,
              s: signedMessage.s,
              v: signedMessage.v,
            }
          );
          //console.log("signedTransaction", signedTransaction);

          setConnected(true, { chainId: activeChain.chainId });
          return signedTransaction;
        }
        case "wallet_addEthereumChain": {
          const [chain] = params as [AddEthereumChainParameter];

          // Validate the to be added
          validateChain(chain, addedChains);

          // Store the current connected chain for potential rollback
          const previousActiveChain = activeChain;

          // Update the connected chain to the new chain
          activeChain = chain;

          // Verify the specified chain ID matches the return value of eth_chainId from the endpoint
          const rpcChainId = await request({ method: "eth_chainId" });

          if (activeChain.chainId !== rpcChainId) {
            // Revert to the previous connected chain or to undefined if no other chain connected
            activeChain = previousActiveChain;
            throw new ChainIdMismatchError(chain.chainId as Hex, rpcChainId);
          }

          addedChains.push({ ...chain, connected: true });

          return null;
        }

        case "wallet_switchEthereumChain": {
          const [targetChainId] = params as [string];
          const targetChain = addedChains.find(
            (chain) => chain.chainId === targetChainId
          );

          if (!targetChain) {
            throw new UnrecognizedChainError(targetChainId);
          }

          activeChain = targetChain;
          eventEmitter.emit("chainChanged", { chainId: activeChain.chainId });
          return null;
        }

        case "eth_sendTransaction": {
          const [transaction] = params as WalletRpcSchema[7]["Parameters"];

          // Map from address to addressIndex
          if (!transaction.from) {
            throw new Error("from is required");
          } else if (!accountsAddresses.has(transaction.from)) {
            throw new Error("from is not a valid address");
          } else {
            addressIndex = [...accountsAddresses].indexOf(transaction.from);
          }

          const signedTransaction = await request({
            method: "eth_signTransaction",
            params: [transaction],
          });

          // Change the method to 'eth_sendRawTransaction' and pass the signed transaction
          method = "eth_sendRawTransaction";
          params = [signedTransaction];
          // Fall through to 'eth_sendRawTransaction' case
        }
        case "eth_sendRawTransaction":
        case "eth_chainId":
        case "eth_subscribe":
        case "eth_unsubscribe":
        case "eth_blobBaseFee":
        case "eth_blockNumber":
        case "eth_call":
        case "eth_coinbase":
        case "eth_estimateGas":
        case "eth_feeHistory":
        case "eth_gasPrice":
        case "eth_getBalance":
        case "eth_getBlockByHash":
        case "eth_getBlockByNumber":
        case "eth_getBlockReceipts":
        case "eth_getBlockTransactionCountByHash":
        case "eth_getBlockTransactionCountByNumber":
        case "eth_getCode":
        case "eth_getFilterChanges":
        case "eth_getFilterLogs":
        case "eth_getLogs":
        case "eth_getProof":
        case "eth_getStorageAt":
        case "eth_getTransactionByBlockHashAndIndex":
        case "eth_getTransactionByBlockNumberAndIndex":
        case "eth_getTransactionByHash":
        case "eth_getTransactionCount":
        case "eth_getTransactionReceipt":
        case "eth_getUncleCountByBlockHash":
        case "eth_getUncleCountByBlockNumber":
        case "eth_maxPriorityFeePerGas":
        case "eth_newBlockFilter":
        case "eth_newFilter":
        case "eth_newPendingTransactionFilter":
        case "eth_syncing":

        case "eth_uninstallFilter":
          const {
            rpcUrls: [rpcUrl],
          } = activeChain;
          if (rpcUrl) {
            const rpcClient = getHttpRpcClient(rpcUrl);

            let response = await rpcClient.request({
              body: {
                method,
                params,
                id: id++,
              },
            });

            if (response.error) {
              throw new RpcRequestError({
                body: { method, params },
                error: response.error,
                url: rpcUrl,
              });
            }

            // Set connected status upon successful Ethereum RPC request
            setConnected(true, { chainId: activeChain.chainId });
            return response.result;
          }
        default:
          throw new MethodNotSupportedRpcError(
            new Error(`Invalid method: ${method}`)
          );
      }
    } catch (error: any) {
      if (
        (error.name === "HttpRequestError" &&
          error.details === "fetch failed") 
      ) {
        setConnected(false, error);
      }
      throw error;
    }
  };

  if (Array.isArray(chains) && chains.length > 0) {
    for (const chain of chains) {
      await request({
        method: "wallet_addEthereumChain",
        params: [chain],
      });
    }
  }

  isInitialized = true;

  return {
    on: eventEmitter.on.bind(eventEmitter),
    removeListener: eventEmitter.removeListener.bind(eventEmitter),
    request,
  } satisfies EIP1193Provider;
};
