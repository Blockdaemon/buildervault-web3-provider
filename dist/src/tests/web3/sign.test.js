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
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ethers = __importStar(require("ethers"));
const web3_eth_accounts_1 = require("web3-eth-accounts");
const utils_1 = require("../utils");
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
const web3 = (0, utils_1.getWeb3BuildervaultProviderForTesting)();
(0, vitest_1.describe)("Web3: Should be able to sign using BuilderVault", () => {
    (0, vitest_1.it)("signMessage", async () => {
        // ToDo: add pause
        const message = "hello world";
        const signerAddress = (await web3.eth.getAccounts())[0];
        const signature = await web3.eth.personal.sign(message, signerAddress, "");
        const recoveredAddress = await (0, web3_eth_accounts_1.recover)(message, signature);
        //const recoveredAddress = ethers.utils.verifyMessage(message, signature)
        (0, vitest_1.expect)(recoveredAddress).to.be.equals(signerAddress);
    });
    (0, vitest_1.it)("eth_signTypedData_v4", async () => {
        var _a;
        const signerAddress = (await web3.eth.getAccounts())[0];
        const domain = {
            name: "FAKE Coin",
            version: "0",
            chainId: 0,
            verifyingContract: NULL_ADDRESS
        };
        const types = {
            Permit: [
                {
                    name: "owner",
                    type: "address"
                },
                {
                    name: "spender",
                    type: "address"
                },
                {
                    name: "value",
                    type: "uint256"
                },
                {
                    name: "nonce",
                    type: "uint256"
                },
                {
                    name: "deadline",
                    type: "uint256"
                }
            ],
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' },
            ],
        };
        const message = {
            owner: NULL_ADDRESS,
            spender: NULL_ADDRESS,
            value: 1,
            nonce: 1,
            deadline: 1
        };
        const primaryType = "Permit";
        const data = {
            types,
            domain,
            message,
            primaryType,
        };
        const signature = await ((_a = web3.currentProvider) === null || _a === void 0 ? void 0 : _a.request({
            method: "eth_signTypedData_v4",
            params: [signerAddress, data],
        }));
        //const signature = await web3.eth.signTypedData(signerAddress, data, false)
        // @ts-ignore
        delete types.EIP712Domain;
        const recoveredAddress = ethers.utils.verifyTypedData(domain, types, message, signature);
        (0, vitest_1.expect)(recoveredAddress).to.be.equals(signerAddress);
    });
});
//# sourceMappingURL=sign.test.js.map