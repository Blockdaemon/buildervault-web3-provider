"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildervaultWeb3Provider = void 0;
const tsmsdkv2_1 = require("@sepior/tsmsdkv2");
// @ts-ignore
const asn1_js_1 = __importDefault(require("asn1.js"));
const web3_utils_1 = require("web3-utils");
const web3_eth_accounts_1 = require("web3-eth-accounts");
const util_1 = __importDefault(require("util"));
const utils_1 = require("./utils");
const constants_1 = require("./constants");
const jsonRpcUtils_1 = require("./jsonRpcUtils");
const debug_1 = __importDefault(require("debug"));
const HttpProvider = require("web3-providers-http");
const logRequestsAndResponses = (0, debug_1.default)(constants_1.DEBUG_NAMESPACE_REQUESTS_AND_RESPONSES);
class BuildervaultWeb3Provider extends HttpProvider {
    constructor(config) {
        if (!config.rpcUrl) {
            throw Error(`rpcUrl is required`);
        }
        const debugNamespaces = [process.env.DEBUG || ''];
        if (config.logRequestsAndResponses) {
            debugNamespaces.push(constants_1.DEBUG_NAMESPACE_REQUESTS_AND_RESPONSES);
        }
        debug_1.default.enable(debugNamespaces.join(','));
        const headers = [];
        super(config.rpcUrl);
        this.headers = [];
        this.accountsAddresses = {};
        this.requestCounter = 0;
        this.config = config;
        this.masterKeyId = config.masterKeyId;
        this.accountId = Number(config.accountId || 0);
        this.addressIndex = Number(config.addressIndex || 0);
        this.chainPath = new Uint32Array([44, 60, this.accountId, 0, this.addressIndex]);
        this.accountsAddresses[this.accountId] = {};
        this.headers = headers;
        this.note = 'Created by BuilderVault Web3 Provider';
        this.chainIdPopulatedPromise = (0, utils_1.promiseToFunction)(async () => { if (!this.chainId)
            return await this.populateChainId(); });
        this.accountsPopulatedPromise = (0, utils_1.promiseToFunction)(async () => { return await this.populateAccounts(); });
    }
    async populateChainId() {
        const chainId = (await util_1.default.promisify(super.send).bind(this)((0, jsonRpcUtils_1.formatJsonRpcRequest)('eth_chainId', []))).result;
        this.chainId = Number(chainId);
    }
    async populateAccounts() {
        var _a;
        if (((_a = this.accountsAddresses[0]) === null || _a === void 0 ? void 0 : _a[0]) !== undefined) {
            throw this.createError({ message: "Accounts already populated" });
        }
        let player0config;
        if (this.config.player0ApiKey) {
            player0config = await new tsmsdkv2_1.Configuration(this.config.player0Url);
            await player0config.withAPIKeyAuthentication(this.config.player0ApiKey);
        }
        else {
            throw new Error('player0ApiKey is required');
        }
        let player1config;
        if (this.config.player1ApiKey) {
            player1config = await new tsmsdkv2_1.Configuration(this.config.player1Url);
            await player1config.withAPIKeyAuthentication(this.config.player1ApiKey);
        }
        else {
            throw new Error('player1ApiKey is required');
        }
        const TSMClients = [
            await tsmsdkv2_1.TSMClient.withConfiguration(player0config),
            await tsmsdkv2_1.TSMClient.withConfiguration(player1config)
        ];
        // ToDo: include this.addressIndex in loop when outside 0-5
        for (let i = 0; i < 5; i++) {
            let chainPath = new Uint32Array([44, 60, this.accountId, 0, i]);
            const pkixPublicKeys = [];
            for (const [_, client] of TSMClients.entries()) {
                const ecdsaApi = client.ECDSA();
                pkixPublicKeys.push(await ecdsaApi.publicKey(this.masterKeyId, chainPath));
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
            const publicKeyBytes = await utils.pkixPublicKeyToUncompressedPoint(pkixPublicKey);
            // Convert web3 publickey to address
            var publicKeyHex = (0, web3_utils_1.toHex)(publicKeyBytes);
            // Remove '0x' prefox 
            if (publicKeyHex.startsWith('0x')) {
                publicKeyHex = publicKeyHex.slice(2);
            }
            // Remove the leading '04' byte (which signifies an uncompressed public key)
            if (publicKeyHex.startsWith('04')) {
                publicKeyHex = publicKeyHex.slice(2);
            }
            // Compute the keccak256 hash of the public key
            const addressBuffer = (0, web3_utils_1.keccak256)(Buffer.from(publicKeyHex, 'hex'));
            // Take the last 20 bytes of the hash, prefix it with '0x', and convert to string
            const depositAddress = (0, web3_utils_1.toChecksumAddress)('0x' + addressBuffer.slice(-40));
            this.accountsAddresses[this.accountId][i] = depositAddress;
        }
    }
    async initialized() {
        // ToDo: check master key exists
        await Promise.all([
            this.chainIdPopulatedPromise(),
            this.accountsPopulatedPromise(),
        ]);
    }
    send(payload, callback) {
        (async () => {
            var _a, _b, _c, _d, _e, _f;
            let result;
            let error = null;
            const requestNumber = ++this.requestCounter;
            try {
                logRequestsAndResponses(`Request #${requestNumber}: method=${payload.method} params=${JSON.stringify(payload.params, undefined, 4)}`);
                if (((_b = (_a = payload === null || payload === void 0 ? void 0 : payload.params) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.input) && !((_d = (_c = payload === null || payload === void 0 ? void 0 : payload.params) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.data)) {
                    payload.params[0].data = (_e = payload.params) === null || _e === void 0 ? void 0 : _e[0].input;
                    (_f = payload.params) === null || _f === void 0 ? true : delete _f[0].input;
                }
                switch (payload.method) {
                    case "eth_requestAccounts":
                    case "eth_accounts":
                        await this.accountsPopulatedPromise();
                        result = Object.values(this.accountsAddresses[this.accountId]).map((address) => address);
                        break;
                    case "eth_sendTransaction":
                        try {
                            result = await this.sendTransaction(payload.params[0]);
                        }
                        catch (error) {
                            throw error;
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
                        const jsonRpcResponse = await util_1.default.promisify(super.send).bind(this)(payload);
                        if (jsonRpcResponse.error) {
                            throw this.createError({
                                message: jsonRpcResponse.error.message,
                                code: jsonRpcResponse.error.code,
                                data: jsonRpcResponse.error.data,
                                payload,
                            });
                        }
                        result = jsonRpcResponse.result;
                }
            }
            catch (e) {
                error = e;
            }
            if (error) {
                logRequestsAndResponses(`Error #${requestNumber}: ${error}`);
            }
            else {
                logRequestsAndResponses(`Response #${requestNumber}: ${JSON.stringify(result, undefined, 4)}`);
            }
            callback(error, (0, jsonRpcUtils_1.formatJsonRpcResult)(payload.id, result));
        })();
    }
    createError(errorData) {
        const error = new Error(errorData.message);
        error.code = errorData.code || -32603;
        error.data = errorData.data;
        error.payload = errorData.payload;
        // We do this to avoid including this function in the stack trace
        if (Error.captureStackTrace !== undefined) {
            Error.captureStackTrace(error, this.createError);
        }
        return error;
    }
    sendAsync(payload, callback) {
        this.send(payload, callback);
    }
    async request(args) {
        return (await util_1.default.promisify(this.send).bind(this)((0, jsonRpcUtils_1.formatJsonRpcRequest)(args.method, args.params))).result;
    }
    async sendTransaction(transaction) {
        await this.initialized();
        if (transaction.chainId && Number(transaction.chainId) != Number(this.chainId)) {
            throw this.createError({ message: `Chain ID of the transaction (${transaction.chainId}) does not match the chain ID of the BuildervaultWeb3Provider (${this.chainId})` });
        }
        if (transaction.from != this.accountsAddresses[this.accountId][this.addressIndex]) {
            throw this.createError({ message: `Transaction sent from an unsupported address: ${transaction.from}` });
        }
        transaction.gasLimit = 21000;
        const unsignedTx = web3_eth_accounts_1.FeeMarketEIP1559Transaction.fromTxData(transaction);
        const unsignedTxHash = unsignedTx.getMessageToSign(true);
        console.log('Raw unisgned transaction:', (0, web3_utils_1.toHex)(unsignedTx.serialize()));
        const { r, s, v } = await this.signTx(unsignedTxHash, this.masterKeyId, this.chainPath);
        const signedTransaction = unsignedTx._processSignature(v.valueOf(), (0, web3_utils_1.hexToBytes)(r), (0, web3_utils_1.hexToBytes)(s));
        const serializeTx = web3_eth_accounts_1.FeeMarketEIP1559Transaction.fromTxData(signedTransaction).serialize();
        console.log('Broadcasting signed transaction:', (0, web3_utils_1.toHex)(serializeTx));
        const args = {
            method: 'eth_sendRawTransaction',
            params: [(0, web3_utils_1.toHex)(serializeTx)]
        };
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
    async signTx(messageToSign, masterKeyId, chainPath) {
        console.log(`Builder Vault signing transaction hash...`);
        let player0config;
        if (this.config.player0ApiKey) {
            player0config = await new tsmsdkv2_1.Configuration(this.config.player0Url);
            await player0config.withAPIKeyAuthentication(this.config.player0ApiKey);
        }
        else {
            throw new Error('player0ApiKey is required');
        }
        let player1config;
        if (this.config.player1ApiKey) {
            player1config = await new tsmsdkv2_1.Configuration(this.config.player1Url);
            await player1config.withAPIKeyAuthentication(this.config.player1ApiKey);
        }
        else {
            throw new Error('player1ApiKey is required');
        }
        const clients = [
            await tsmsdkv2_1.TSMClient.withConfiguration(player0config),
            await tsmsdkv2_1.TSMClient.withConfiguration(player1config)
        ];
        const sessionConfig = await tsmsdkv2_1.SessionConfig.newStaticSessionConfig(await tsmsdkv2_1.SessionConfig.GenerateSessionID(), clients.length);
        const partialSignatures = [];
        const partialSignaturePromises = [];
        for (const [_, client] of clients.entries()) {
            const func = async () => {
                const ecdsaApi = client.ECDSA();
                console.log(`Creating partialSignature with MPC player ${_}...`);
                const partialSignResult = await ecdsaApi.sign(sessionConfig, masterKeyId, chainPath, messageToSign);
                partialSignatures.push(partialSignResult);
            };
            partialSignaturePromises.push(func());
        }
        await Promise.all(partialSignaturePromises);
        const ecdsaApi = clients[0].ECDSA();
        const signature = await ecdsaApi.finalizeSignature(messageToSign, partialSignatures);
        // Define ASN.1 structure for decoding
        const ASN1Signature = asn1_js_1.default.define("Signature", function () {
            this.seq().obj(this.key("r").int(), this.key("s").int());
        });
        const decodedSignature = ASN1Signature.decode(Buffer.from(signature.signature));
        return {
            r: "0x" + decodedSignature.r.toString(16),
            s: "0x" + decodedSignature.s.toString(16),
            v: BigInt(signature.recoveryID + 27), //  Type 2 transaction with ._processSignature subtracts 27 Post EIP-155 should be: chainId * 2 + 35 + signature.recoveryID;
        };
    }
}
exports.BuildervaultWeb3Provider = BuildervaultWeb3Provider;
//# sourceMappingURL=provider.js.map