import { TSMClient, Configuration, SessionConfig } from "@sepior/tsmsdkv2";
// @ts-ignore
import asn1 from "asn1.js";
import { keccak256, toHex, hexToBytes, toChecksumAddress, hexToString, hexToNumber } from 'web3-utils';
import { encodeParameters } from 'web3-eth-abi';
import { FeeMarketEIP1559Transaction, hashMessage } from 'web3-eth-accounts';
import util from "util";
import { promiseToFunction } from "./utils";
import { AccountAddresses, BuildervaultProviderConfig, EthereumSignature, ProviderRpcError, RequestArguments } from "./types";
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

          case "personal_sign":
          case "eth_sign":
            result = await this.createPersonalSign(payload.params[1], payload.params[0]);
            break;
          
          case "eth_signTypedData":
          case "eth_signTypedData_v1":
          case "eth_signTypedData_v3":
          case "eth_signTypedData_v4":
            result = await this.createTypedDataSign(payload.params[0], payload.params[1]);
            break;
          case "eth_signTypedData_v2":
          case "eth_signTransaction":

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

    if (transaction.chainId === undefined) {
      transaction.chainId = this.chainId
    } else {
      if (Number(transaction.chainId) != Number(this.chainId)) {
        throw this.createError({ message: `Chain ID of the transaction (${transaction.chainId}) does not match the chain ID of the BuildervaultWeb3Provider (${this.chainId})` })
      }
    }

    if (transaction.from != this.accountsAddresses[this.accountId][this.addressIndex]) {
      throw this.createError({ message: `Transaction sent from an unsupported address: ${transaction.from}` })
    }

    if (transaction.nonce === undefined) {
      let args: RequestArguments = {
        method: 'eth_getTransactionCount',
        params: [transaction.from, "pending"]
      }
      const nonce = await this.request(args);
      transaction.nonce = hexToNumber(nonce);
    }

    if (transaction.type === undefined) {
      transaction.type = 2;
    }

    if (transaction.gasLimit === undefined) {
      let args: RequestArguments = {
        method: 'eth_estimateGas',
        params: [{
          from: transaction.from,
          to: transaction.to,
          value: transaction.value,
          data: transaction.data}]
      }
      const gasLimit = await this.request(args);
      transaction.gasLimit = hexToNumber(gasLimit);
    }
    // ToDo maxFeePerGas and maxPriorityFeePerGas

    const unsignedTx = FeeMarketEIP1559Transaction.fromTxData(transaction);
    const unsignedTxHash = unsignedTx.getMessageToSign(true);
    console.log('Raw unisgned transaction:', toHex(unsignedTx.serialize()));

    const {r,s,v} = await this.signTx(unsignedTxHash, this.masterKeyId, this.chainPath);

    const signedTransaction = unsignedTx._processSignature(v.valueOf(), hexToBytes(r), hexToBytes(s));

    const serializeTx = FeeMarketEIP1559Transaction.fromTxData(signedTransaction).serialize();
    console.log('Broadcasting signed transaction:', toHex(serializeTx));

    let args: RequestArguments = {
      method: 'eth_sendRawTransaction',
      params: [toHex(serializeTx)]
    }
    const signedTxHash = this.request(args);

    return signedTxHash;
  }

  private async createPersonalSign(address: string, content: any): Promise<string> {
    await this.initialized()

    //ToDo look up address
    if (address != this.accountsAddresses[this.accountId][this.addressIndex]) {
      throw this.createError({ message: `Signature request from an unsupported address: ${address}` })
    }

    // https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sign
    const message = hexToString(content);
    const messageHashBytes = hexToBytes(hashMessage(message));

    const signature = await this.signTx(messageHashBytes, this.masterKeyId, this.chainPath);

    return signature.r + signature.s.slice(2) + signature.v.toString(16);
  }

  private async createTypedDataSign(address: string, content: any): Promise<string> {
    await this.initialized()

    //ToDo look up address
    if (address != this.accountsAddresses[this.accountId][this.addressIndex]) {
      throw this.createError({ message: `Signature request from an unsupported address: ${address}` })
    }

    // Compute the domain separator
    const domainSeparator = this.hashStruct('EIP712Domain', content.domain, content.types);

    // Compute the message hash
    const messageHash = this.hashStruct(content.primaryType, content.message, content.types);

    // Compute the digest to sign
    const digest = keccak256(
      Buffer.concat([
        Buffer.from('1901', 'hex'),
        Buffer.from(domainSeparator.slice(2), 'hex'),
        Buffer.from(messageHash.slice(2), 'hex'),
      ])
    );

    const signature = await this.signTx(hexToBytes(digest), this.masterKeyId, this.chainPath);

    return signature.r + signature.s.slice(2) + signature.v.toString(16);
  }

  // Helper function to find dependencies of the primary type
  private findDependencies(primaryType: string, types: any, results?: Set<string>): Set<string> {
    if (results === undefined) {
      results = new Set<string>();
    }
    if (results.has(primaryType)) {
      return results;
    }
    results.add(primaryType);
    const fields = types[primaryType];
    if (!fields) return results;
    for (const field of fields) {
      if (types[field.type]) {
        this.findDependencies(field.type, types, results);
      } else if (field.type.endsWith(']')) {
        // Handle array types
        const arrayType = field.type.slice(0, field.type.indexOf('['));
        if (types[arrayType]) {
          this.findDependencies(arrayType, types, results);
        }
      }
    }
    return results;
  }

  // Helper function to encode the type
  private encodeType(primaryType: string, types: any): string {
    let result = '';
    const deps = Array.from(this.findDependencies(primaryType, types));
    deps.splice(deps.indexOf(primaryType), 1);
    deps.sort();
    deps.unshift(primaryType);
    for (const type of deps) {
      const children = types[type];
      result += `${type}(${children.map(({ type, name }: any) => `${type} ${name}`).join(',')})`;
    }
    return result;
  }

  // Helper function to compute type hash
  private typeHash(primaryType: string, types: any): string {
    return keccak256(this.encodeType(primaryType, types));
  }

  // Helper function to encode data
  private encodeData(primaryType: string, data: any, types: any): string {
    const encTypes: string[] = [];
    const encValues: any[] = [];

    // Add type hash
    encTypes.push('bytes32');
    encValues.push(this.typeHash(primaryType, types));

    // Encode each field
    for (const field of types[primaryType]) {
      let value = data[field.name];
      if (field.type === 'string' || field.type === 'bytes') {
        value = keccak256(value);
        encTypes.push('bytes32');
        encValues.push(value);
      } else if (types[field.type] !== undefined) {
        // Struct
        value = keccak256(this.encodeData(field.type, value, types));
        encTypes.push('bytes32');
        encValues.push(value);
      } else if (field.type.lastIndexOf(']') === field.type.length - 1) {
        throw new Error('Arrays are currently unimplemented in encodeData');
      } else {
        encTypes.push(field.type);
        encValues.push(value);
      }
    }

    return encodeParameters(encTypes, encValues);
  }

  // Helper function to compute struct hash
  private hashStruct(primaryType: string, data: any, types: any): string {
    return keccak256(this.encodeData(primaryType, data, types));
  }


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