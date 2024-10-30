"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeb3BuildervaultProviderForTesting = exports.getEthersBuildervaultProviderForTesting = exports.getBuildervaultProviderForTesting = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const ethers = __importStar(require("ethers"));
const __1 = require("..");
const web3_1 = __importDefault(require("web3"));
function getBuildervaultProviderForTesting(extraConfiguration) {
    if (!process.env.BLOCKDAEMON_RPC_URL ||
        !process.env.BUILDERVAULT_PLAYER0_URL ||
        !process.env.BUILDERVAULT_PLAYER0_APIKEY ||
        !process.env.BUILDERVAULT_PLAYER1_URL ||
        !process.env.BUILDERVAULT_PLAYER1_APIKEY ||
        !process.env.BUILDERVAULT_MASTERKEY_ID) {
        throw new Error("Environment variables BLOCKDAEMON_RPC_URL, BUILDERVAULT_PLAYER0_URL, BUILDERVAULT_PLAYER0_APIKEY must be set");
    }
    const providerConfig = Object.assign({ rpcUrl: process.env.BLOCKDAEMON_RPC_URL, player0Url: process.env.BUILDERVAULT_PLAYER0_URL, player0ApiKey: process.env.BUILDERVAULT_PLAYER0_APIKEY, player1Url: process.env.BUILDERVAULT_PLAYER1_URL, player1ApiKey: process.env.BUILDERVAULT_PLAYER1_APIKEY, masterKeyId: process.env.BUILDERVAULT_MASTERKEY_ID, accountId: process.env.BUILDERVAULT_ACCOUNT_ID, addressIndex: process.env.BUILDERVAULT_ADDRESS_INDEX, logRequestsAndResponses: true }, extraConfiguration);
    const provider = new __1.BuildervaultWeb3Provider(providerConfig);
    return provider;
}
exports.getBuildervaultProviderForTesting = getBuildervaultProviderForTesting;
function getEthersBuildervaultProviderForTesting(extraConfiguration) {
    return new ethers.providers.Web3Provider(getBuildervaultProviderForTesting(extraConfiguration));
}
exports.getEthersBuildervaultProviderForTesting = getEthersBuildervaultProviderForTesting;
function getWeb3BuildervaultProviderForTesting(extraConfiguration) {
    return new web3_1.default(getBuildervaultProviderForTesting(extraConfiguration));
}
exports.getWeb3BuildervaultProviderForTesting = getWeb3BuildervaultProviderForTesting;
//# sourceMappingURL=utils.js.map