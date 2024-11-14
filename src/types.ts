
export type BuildervaultProviderConfig = {
  // ------------- Mandatory fields -------------
  /** 
   * Set the RPC API URL endpoint for JSON-RPC over HTTP access to the blockchain data
   */
  rpcUrl?: string,
  /** 
   * Set the numnber of the BuilderVault players
   */
  playerCount?: number
  /** 
   * Set the URL of each BuilderVault player endpoint
   */
  player0Url?: string,
  player1Url?: string,
  player2Url?: string,
  /**
   * Set the BuilderVault TSM API keys or use Client Certificate authentication
   */
  player0ApiKey?: string,
  player1ApiKey?: string,
  player2ApiKey?: string,
  /** 
   * Set the BuilderVault TSM mTLS Client Authentication Certficate key pair or use API Key authentication
   */
  player0ClientCert?: string,
  player0ClientKey?: string,
  player1ClientCert?: string,
  player1ClientKey?: string,
  player2ClientCert?: string,
  player2ClientKey?: string,
  /** 
   * BuilderVault Master Key ID. This ID represents all the private Master Key shares and must be generated outside if the web3 provider using the BuilderVault SDK
   */
  masterKeyId?: string,
  /** 
   * It is recommended to provide the account id explicitly.
   * This represents the <account> in the BIP44 chain path m/44/60/account/0/address_index
   */
  accountId?: number,
  /** 
   * By default, the first 5 addresses are derived from the master key
   * It is recommended to provide the address index explicitly.
   * This represents the <address_index> in the BIP44 chain path  m/44/60/account/0/address_index
   */
  addressIndex?: number,

  // ------------- Optional fields --------------
  /** 
   * Set the MPC publickey of each BuilderVault player. This is required for Dynamic communication between nodes such as through a broker and not static communication
   */
  player0MPCpublicKey?: string,
  player1MPCpublicKey?: string,
  player2MPCpublicKey?: string,
  /**
  /** 
   * Set the TLS publickey of each BuilderVault player endpoint. This is used for mTLS server certificate pinning.
   */
  player0mTLSpublicKey?: string,
  player1mTLSpublicKey?: string,
  player2mTLSpublicKey?: string,
  /**
   * Default: false
   * By setting to true, every request and response processed by the provider will be logged to the console
   * Same as setting env var `DEBUG=buildervault-web3-provider:req_res`
   */
  logRequestsAndResponses?: boolean,
}

export type EthereumSignature = {
  r: string,
  s: string,
  v: number,
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
