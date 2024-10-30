import { BuildervaultProviderConfig, RequestArguments } from "./types";
declare const HttpProvider: any;
export declare class BuildervaultWeb3Provider extends HttpProvider {
    private config;
    private headers;
    private accountsAddresses;
    private accountId;
    private accountsPopulatedPromise;
    private chainIdPopulatedPromise;
    private requestCounter;
    constructor(config: BuildervaultProviderConfig);
    private populateChainId;
    private populateAccounts;
    private initialized;
    send(payload: any, callback: (error: any, response: any) => void): void;
    private createError;
    sendAsync(payload: any, callback: (error: any, response: any) => void): void;
    request(args: RequestArguments): Promise<any>;
    private sendTransaction;
    private createPersonalSign;
    private createTypedDataSign;
    private structHash;
    private typeHash;
    private signTx;
}
export {};
//# sourceMappingURL=provider.d.ts.map