import { TSMClient, Configuration, SessionConfig } from "@sepior/tsmsdkv2";
// @ts-ignore
import asn1 from "asn1.js";
import { keccak256, toHex, hexToBytes, toChecksumAddress } from 'web3-utils';
import { FeeMarketEIP1559Transaction } from 'web3-eth-accounts';
import util from "util";
import { promiseToFunction } from "./utils";
import { AccountAddresses, BuildervaultProviderConfig, EthereumSignature, ProviderRpcError, RequestArguments,  } from "./types";
import { DEBUG_NAMESPACE_REQUESTS_AND_RESPONSES } from "./constants";
import { formatJsonRpcRequest, formatJsonRpcResult } from "./jsonRpcUtils";
import Debug from "debug";
const HttpProvider = require("web3-providers-http");
const logRequestsAndResponses = Debug(DEBUG_NAMESPACE_REQUESTS_AND_RESPONSES);


export class BuildervaultWeb3Provider extends HttpProvider {
  private config: BuildervaultProviderConfig;
  private headers: { name: string, value: string }[] = [];
  private accountsAddresses: AccountAddresses = {};
  private accountId: number;
  private accountsPopulatedPromise: () => Promise<void>;
  private chainIdPopulatedPromise: () => Promise<void>;
  private requestCounter = 0;

  constructor(config: BuildervaultProviderConfig) {
    if (!config.rpcUrl) {
      throw Error(`rpcUrl is required`);
    }

    const debugNamespaces = [process.env.DEBUG || '']
    if (config.logRequestsAndResponses) {
      debugNamespaces.push(DEBUG_NAMESPACE_REQUESTS_AND_RESPONSES)
    }
    Debug.enable(debugNamespaces.join(','))

    const headers: { name: string, value: string }[] = []

    super(config.rpcUrl)
    this.config = config

    this.masterKeyId = config.masterKeyId;
    this.accountId = Number(config.accountId || 0)
    this.addressIndex = Number(config.addressIndex || 0)
    this.chainPath = new Uint32Array([44, 60, this.accountId, 0, this.addressIndex]);
    this.accountsAddresses[this.accountId] = {};

    this.headers = headers;

    this.note = 'Created by BuilderVault Web3 Provider'

    this.chainIdPopulatedPromise = promiseToFunction(async () => { if (!this.chainId) return await this.populateChainId() })
    this.accountsPopulatedPromise = promiseToFunction(async () => { return await this.populateAccounts() })
  }


  private async populateChainId() {
    const chainId = (await util.promisify<any, any>(super.send).bind(this)(formatJsonRpcRequest('eth_chainId', []))).result
    this.chainId = Number(chainId)
  }

  private async populateAccounts() {

    if (this.accountsAddresses[0]?.[0] !== undefined) {
      throw this.createError({ message: "Accounts already populated" })
    }

    let player0config
    if (this.config.player0ApiKey) {
      player0config = await new Configuration(this.config.player0Url);
      await player0config.withAPIKeyAuthentication(this.config.player0ApiKey);
    } else {
      throw new Error('player0ApiKey is required');
    }

    let player1config
    if (this.config.player1ApiKey) {
      player1config = await new Configuration(this.config.player1Url);
      await player1config.withAPIKeyAuthentication(this.config.player1ApiKey);
    } else {
      throw new Error('player1ApiKey is required');
    }

    const TSMClients: TSMClient[] = [
      await TSMClient.withConfiguration(player0config),
      await TSMClient.withConfiguration(player1config)
    ];

    // ToDo: include this.addressIndex in loop when outside 0-5
    for (let i = 0; i < 5; i++) {

      let chainPath = new Uint32Array([44, 60, this.accountId, 0, i]);
      const pkixPublicKeys: Uint8Array[] = [];
    
      for (const [_, client] of TSMClients.entries()) {
        const ecdsaApi = client.ECDSA();
        pkixPublicKeys.push(
          await ecdsaApi.publicKey(this.masterKeyId, chainPath)
        );
      }
    
      // Validate public keys
      for (let i = 1; i < pkixPublicKeys.length; i++) {
          if (Buffer.compare(pkixPublicKeys[0], pkixPublicKeys[i]) !== 0) {
            throw Error("public keys do not match");
          }
        }
        
      const pkixPublicKey = pkixPublicKeys[0];
    
      // Convert the public key into an Ethereum address
      const utils = TSMClients[0].Utils();
      const publicKeyBytes = await utils.pkixPublicKeyToUncompressedPoint(
        pkixPublicKey
      );
    
      // Convert web3 publickey to address
      var publicKeyHex = toHex(publicKeyBytes);
    
      // Remove '0x' prefox 
      if (publicKeyHex.startsWith('0x')) {
        publicKeyHex = publicKeyHex.slice(2);
      }
    
      // Remove the leading '04' byte (which signifies an uncompressed public key)
      if (publicKeyHex.startsWith('04')) {
        publicKeyHex = publicKeyHex.slice(2);
      }
    
      // Compute the keccak256 hash of the public key
      const addressBuffer = keccak256(Buffer.from(publicKeyHex, 'hex'));
    
      // Take the last 20 bytes of the hash, prefix it with '0x', and convert to string
      const depositAddress = toChecksumAddress('0x' + addressBuffer.slice(-40));
    
      this.accountsAddresses[this.accountId][i] = depositAddress;
    }
    
  }


  private async initialized() {
    // ToDo: check master key exists
    await Promise.all(
      [
        this.chainIdPopulatedPromise(),
        this.accountsPopulatedPromise(),
      ]
    )
  }


  public send(
    payload: any,
    callback: (error: any, response: any) => void
  ): void {
    (async () => {
      let result;
      let error = null;
      const requestNumber = ++this.requestCounter;

      try {
        logRequestsAndResponses(`Request #${requestNumber}: method=${payload.method} params=${JSON.stringify(payload.params, undefined, 4)}`)

        if (payload?.params?.[0]?.input && !payload?.params?.[0]?.data) {
          payload.params[0].data = payload.params?.[0].input
          delete payload.params?.[0].input
        }

        switch (payload.method) {
          case "eth_requestAccounts":
          case "eth_accounts":
            await this.accountsPopulatedPromise()
            result = Object.values(this.accountsAddresses[this.accountId]).map((address) => address);
            break;

          case "eth_sendTransaction":
            try {
                result = await this.sendTransaction(payload.params[0]);
            } catch (error) {
              throw error
            }
            break;

          // Todo:
          // case "personal_sign":
          // case "eth_sign":
          //   result = await this.createPersonalSign(payload.params[1], payload.params[0], TYPED_MESSAGE, ETH_MESSAGE);
          //   break;
          // case "eth_signTypedData":
          // case "eth_signTypedData_v1":
          // case "eth_signTypedData_v3":
          // case "eth_signTypedData_v4":
          //   result = await this.createPersonalSign(payload.params[0], payload.params[1], TYPED_MESSAGE, EIP712);
          //   break;
          // case "eth_signTypedData_v2":
          // case "eth_signTransaction":

          default:
            const jsonRpcResponse = await util.promisify<any, any>(super.send).bind(this)(payload)

            if (jsonRpcResponse.error) {
              throw this.createError({
                message: jsonRpcResponse.error.message,
                code: jsonRpcResponse.error.code,
                data: jsonRpcResponse.error.data,
                payload,
              })
            }

            result = jsonRpcResponse.result
        }
      } catch (e) {
        error = e;
      }

      if (error) {
        logRequestsAndResponses(`Error #${requestNumber}: ${error}`)
      } else {
        logRequestsAndResponses(`Response #${requestNumber}: ${JSON.stringify(result, undefined, 4)}`)
      }
      callback(error, formatJsonRpcResult(payload.id, result));
    })();
  }


  private createError(errorData: { message: string, code?: number, data?: any, payload?: any }): ProviderRpcError {
    const error = new Error(errorData.message) as ProviderRpcError
    error.code = errorData.code || -32603
    error.data = errorData.data
    error.payload = errorData.payload

    // We do this to avoid including this function in the stack trace
    if ((Error as any).captureStackTrace !== undefined) {
      (Error as any).captureStackTrace(error, this.createError);
    }

    return error
  }

  public sendAsync(
    payload: any,
    callback: (error: any, response: any) => void
  ): void {
    this.send(payload, callback);
  }

  public async request(
    args: RequestArguments
  ): Promise<any> {
    return (await util.promisify(this.send).bind(this)(formatJsonRpcRequest(args.method, args.params))).result;
  }


  private async sendTransaction(transaction: any) {
    await this.initialized()
    if (transaction.chainId && Number(transaction.chainId) != Number(this.chainId)) {
      throw this.createError({ message: `Chain ID of the transaction (${transaction.chainId}) does not match the chain ID of the BuildervaultWeb3Provider (${this.chainId})` })
    }

    if (transaction.from != this.accountsAddresses[this.accountId][this.addressIndex]) {
      throw this.createError({ message: `Transaction sent from an unsupported address: ${transaction.from}` })
    }

    transaction.gasLimit = 21000;
    const unsignedTx = FeeMarketEIP1559Transaction.fromTxData(transaction);
    const unsignedTxHash = unsignedTx.getMessageToSign(true);
    console.log('Raw unisgned transaction:', toHex(unsignedTx.serialize()));

    const {r,s,v} = await this.signTx(unsignedTxHash, this.masterKeyId, this.chainPath);

    const signedTransaction = unsignedTx._processSignature(v.valueOf(), hexToBytes(r), hexToBytes(s));

    const serializeTx = FeeMarketEIP1559Transaction.fromTxData(signedTransaction).serialize();
    console.log('Broadcasting signed transaction:', toHex(serializeTx));

    const args: RequestArguments = {
      method: 'eth_sendRawTransaction',
      params: [toHex(serializeTx)]
    }
    const signedTxHash = this.request(args);

    return signedTxHash;
  }

  // private async createPersonalSign(address: string, content: any, operation: TransactionOperation, type: RawMessageType): Promise<string> {
  //   await this.initialized()
  //   const accountId = this.acountIdAndValidateExistence(address, `Signature request from an unsupported address: `);

  //   let finalContent = content;

  //   if (type === EIP712) {
  //     if (typeof content !== 'object') {
  //       finalContent = JSON.parse(content);
  //     } else {
  //       finalContent = content;
  //     }
  //   } else if (finalContent.startsWith("0x")) {
  //     finalContent = finalContent.substring(2);
  //   }

  //   let message;
  //   if (operation === TYPED_MESSAGE) {
  //     message = {
  //       content: finalContent,
  //       index: 0,
  //       type: type,
  //     };
  //   } else {
  //     message = {
  //       content: finalContent
  //     };
  //   }
  // }

  private async signTx(
    messageToSign: Uint8Array,
    masterKeyId: string,
    chainPath: Uint32Array
  ): Promise<EthereumSignature> {
  
  
    console.log(`Builder Vault signing transaction hash...`);
  
    let player0config
    if (this.config.player0ApiKey) {
      player0config = await new Configuration(this.config.player0Url);
      await player0config.withAPIKeyAuthentication(this.config.player0ApiKey);
    } else {
      throw new Error('player0ApiKey is required');
    }

    let player1config
    if (this.config.player1ApiKey) {
      player1config = await new Configuration(this.config.player1Url);
      await player1config.withAPIKeyAuthentication(this.config.player1ApiKey);
    } else {
      throw new Error('player1ApiKey is required');
    }

    const clients: TSMClient[] = [
      await TSMClient.withConfiguration(player0config),
      await TSMClient.withConfiguration(player1config)
    ];

    const sessionConfig = await SessionConfig.newStaticSessionConfig(
      await SessionConfig.GenerateSessionID(),
      clients.length
    );
  
    const partialSignatures: Uint8Array[] = [];
  
    const partialSignaturePromises: Promise<void>[] = [];
  
    for (const [_, client] of clients.entries()) {
      const func = async (): Promise<void> => {
        const ecdsaApi = client.ECDSA();
        console.log(`Creating partialSignature with MPC player ${_}...`);
        const partialSignResult = await ecdsaApi.sign(
          sessionConfig,
          masterKeyId,
          chainPath,
          messageToSign
        );
  
        partialSignatures.push(partialSignResult);
      };
  
      partialSignaturePromises.push(func());
    }
  
    await Promise.all(partialSignaturePromises);
  
    const ecdsaApi = clients[0].ECDSA();
  
    const signature = await ecdsaApi.finalizeSignature(
      messageToSign,
      partialSignatures
    );
  
    // Define ASN.1 structure for decoding
    const ASN1Signature = asn1.define("Signature", function (this: asn1.ASN1) {
      this.seq().obj(
        this.key("r").int(),
        this.key("s").int()
      );
    });
  
    const decodedSignature = ASN1Signature.decode(Buffer.from(signature.signature));
  
    return {
      r: "0x" + decodedSignature.r.toString(16),
      s: "0x" + decodedSignature.s.toString(16),
      v: BigInt(signature.recoveryID! + 27),  //  Type 2 transaction with ._processSignature subtracts 27 Post EIP-155 should be: chainId * 2 + 35 + signature.recoveryID;
    };
  }

}