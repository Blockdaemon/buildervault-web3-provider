export declare type BuildervaultProviderConfig = {
    /**
     * Set the RPC API URL endpoint for JSON-RPC over HTTP access to the blockchain data
     */
    rpcUrl?: string;
    /**
     * Set the URL of the BuilderVault player0 and player1 endpoints
     */
    player0Url?: string;
    player1Url?: string;
    /**
     * Set the BuilderVault TSM API keys
     */
    player0ApiKey?: string;
    player1ApiKey?: string;
    /**
     * BuilderVault Master Key ID. This ID represents all the private Master Key shares and must be generated outside if the web3 provider using the BuilderVault SDK
     */
    masterKeyId?: string;
    /**
     * It is recommended to provide the account id explicitly.
     * This represents the <account> in the BIP44 chain path m/44/60/account/0/address_index
     */
    accountId?: number;
    /**
     * By default, the first 5 addresses are derived from the master key
     * It is recommended to provide the address index explicitly.
     * This represents the <address_index> in the BIP44 chain path  m/44/60/account/0/address_index
     */
    addressIndex?: number;
    /**
     * Default: false
     * By setting to true, every request and response processed by the provider will be logged to the console
     * Same as setting env var `DEBUG=buildervault-web3-provider:req_res`
     */
    logRequestsAndResponses?: boolean;
};
export declare type EthereumSignature = {
    r: string;
    s: string;
    v: BigInt;
};
export interface AccountAddresses {
    [accountId: number]: {
        [accountIndex: number]: string;
    };
}
export interface RequestArguments<T = any> {
    method: string;
    params?: T;
}
export interface ProviderRpcError extends Error {
    code: number;
    data?: unknown;
    payload: RequestArguments;
}
//# sourceMappingURL=types.d.ts.map