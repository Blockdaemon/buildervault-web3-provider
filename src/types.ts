import type {
  AddEthereumChainParameter,
  Address,
  Chain,
  EIP1193Provider,
  EIP1193RequestFn,
  EIP1474Methods,
  Hash,
  TypedDataDefinition,
} from "viem";

/**
 * Configuration for the Buildervault Web3 Provider
 */
export type BuildervaultProviderConfig = {
  // ------------- Mandatory fields -------------
  /** 
   * Set the numnber of the BuilderVault MPC players
   */
  playerCount: number;
  /** 
   * Set the URL of each BuilderVault player endpoint
   */
  player0Url?: string;
  player1Url?: string;
  player2Url?: string;
  /**
   * Set the BuilderVault TSM API keys or use Client Certificate authentication
   */
  player0ApiKey?: string;
  player1ApiKey?: string;
  player2ApiKey?: string;
  /** 
   * Set the BuilderVault TSM mTLS Client Authentication Certficate key pair or use API Key authentication
   */
  player0ClientCert?: string;
  player0ClientKey?: string;
  player1ClientCert?: string;
  player1ClientKey?: string;
  player2ClientCert?: string;
  player2ClientKey?: string;
  /** 
   * BuilderVault Master Key ID. This ID represents all the private Master Key shares and must be generated outside if the web3 provider using the BuilderVault SDK
   */
  masterKeyId: string;
  /** 
   * It is recommended to provide the account id explicitly.
   * This represents the <account> in the BIP44 chain path m/44/60/account/0/address_index
   */
  accountId: number;
  /** 
   * By default, the first 5 addresses are derived from the master key
   * It is recommended to provide the address index explicitly.
   * This represents the <address_index> in the BIP44 chain path  m/44/60/account/0/address_index
   */
  addressIndex?: number;

  // ------------- Optional fields --------------
  /** 
   * Set the MPC publickey of each BuilderVault player. This is required for Dynamic communication between nodes such as through a broker and not static communication
   */
  player0MPCpublicKey?: string;
  player1MPCpublicKey?: string;
  player2MPCpublicKey?: string;
  /**
  /** 
   * Set the TLS publickey of each BuilderVault player endpoint. This is used for mTLS server certificate pinning.
   */
  player0mTLSpublicKey?: string;
  player1mTLSpublicKey?: string;
  player2mTLSpublicKey?: string;

  chains: AddEthereumChainParameter[];
}

export interface AccountAddresses {
  [accountId: number]: {
    [accountIndex: number]: Address;
  };
}

/**
 * The Buildervault Web3 Provider interface
 */
export type BuildervaultWeb3Provider = Omit<EIP1193Provider, "request"> & {
  request: EIP1193RequestFn<
    [
      ...EIP1474Methods,
      {
        Method: "eth_signTypedData_v4";
        Parameters: [address: Address, typedData: TypedDataDefinition];
        ReturnType: Promise<Hash>;
      }
    ]
  >;
};

export type ProviderChain = Omit<Chain, "nativeCurrency"> & {
  nativeCurrency?: Chain["nativeCurrency"] | undefined;
};

export type HTTPSUrl = `https://${string}`;

export type WalletAddEthereumChain = Omit<
  AddEthereumChainParameter,
  "rpcUrls" | "blockExplorerUrls"
> & {
  rpcUrls: [string, ...string[]];
  blockExplorerUrls: [HTTPSUrl, ...HTTPSUrl[]] | null;
};

export interface ConnectInfo {
  chainId: string;
}
