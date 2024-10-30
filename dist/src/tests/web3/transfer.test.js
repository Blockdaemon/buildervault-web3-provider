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
const utils_1 = require("../utils");
const transferAmount = ethers.utils.parseEther("0.00000000001").toString();
const minAmount = ethers.utils.parseEther("0.001").toString();
const web3 = (0, utils_1.getWeb3BuildervaultProviderForTesting)();
async function getFirstAddressWithBalance() {
    const addresses = await web3.eth.getAccounts();
    for (const address of addresses) {
        const balance = await web3.eth.getBalance(address);
        if (BigInt(balance) > BigInt(minAmount)) {
            return address.toLowerCase();
        }
    }
    throw new Error(`No vault has balance greater than ${transferAmount.toString()}`);
}
(0, vitest_1.describe)("Web3: Should be able to transfer ETH", async function () {
    (0, vitest_1.it)("Transfer", async function () {
        const addresses = await web3.eth.getAccounts();
        //const fromAddress = await getFirstAddressWithBalance()
        const fromAddress = (await web3.eth.getAccounts())[0];
        const toAddress = addresses.find(x => x != fromAddress);
        if (!toAddress) {
            throw new Error('No toAddress found');
        }
        const toAddressStartingBalance = await web3.eth.getBalance(toAddress);
        const feeData = await web3.eth.calculateFeeData();
        await web3.eth.sendTransaction({
            chainId: await web3.eth.getChainId(),
            from: fromAddress,
            to: toAddress,
            value: transferAmount,
            //gasLimit: 21000,
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        });
        const toAddressEndingBalance = await web3.eth.getBalance(toAddress);
        (0, vitest_1.expect)(BigInt(toAddressEndingBalance) == (BigInt(toAddressStartingBalance) - BigInt(transferAmount)));
    });
});
//# sourceMappingURL=transfer.test.js.map