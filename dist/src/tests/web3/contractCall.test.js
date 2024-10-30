"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const utils_1 = require("../utils");
const GREETER_ADDRESS = "0x432d810484AdD7454ddb3b5311f0Ac2E95CeceA8"; // Holesky
const GREETER_ABI = [
    {
        "type": "function",
        "name": "greet",
        "inputs": [],
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ]
    },
    {
        "type": "function",
        "name": "setGreeting",
        "inputs": [
            {
                "internalType": "string",
                "name": "_greeting",
                "type": "string"
            }
        ],
        "outputs": []
    }
];
const provider = (0, utils_1.getWeb3BuildervaultProviderForTesting)();
const greeting = (new Date()).toISOString();
const greeterContract = new provider.eth.Contract(GREETER_ABI, GREETER_ADDRESS);
async function getFirstAddressWithBalance() {
    const addresses = await provider.eth.getAccounts();
    for (const address of addresses) {
        const balance = await provider.eth.getBalance(address);
        if (BigInt(balance) > BigInt(provider.utils.toWei('0.01', 'ether'))) {
            return address;
        }
    }
    throw new Error(`No vault has balance`);
}
(0, vitest_1.describe)("Web3: Should be able to call a contract method", () => {
    (0, vitest_1.it)("greet() before", async () => {
        const currentGreeting = await greeterContract.methods.greet().call();
        (0, vitest_1.expect)(currentGreeting).to.not.be.equal(greeting);
    });
    (0, vitest_1.it)("setGreeting(greeting)", async () => {
        const receipt = await greeterContract.methods.setGreeting(greeting).send({ from: await getFirstAddressWithBalance() });
        (0, vitest_1.expect)(receipt.transactionHash).to.be.not.undefined;
    });
    (0, vitest_1.it)("greet() after", async () => {
        const currentGreeting = await greeterContract.methods.greet().call();
        (0, vitest_1.expect)(currentGreeting).to.be.equal(greeting);
    });
});
//# sourceMappingURL=contractCall.test.js.map