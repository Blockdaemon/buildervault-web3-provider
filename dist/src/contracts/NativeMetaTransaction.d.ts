import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, PayableOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "./common";
export interface NativeMetaTransactionInterface extends utils.Interface {
    functions: {
        "ERC712_VERSION()": FunctionFragment;
        "executeMetaTransaction(address,bytes,bytes32,bytes32,uint8)": FunctionFragment;
        "getChainId()": FunctionFragment;
        "getNonce(address)": FunctionFragment;
        "name()": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "ERC712_VERSION" | "executeMetaTransaction" | "getChainId" | "getNonce" | "name"): FunctionFragment;
    encodeFunctionData(functionFragment: "ERC712_VERSION", values?: undefined): string;
    encodeFunctionData(functionFragment: "executeMetaTransaction", values: [
        PromiseOrValue<string>,
        PromiseOrValue<BytesLike>,
        PromiseOrValue<BytesLike>,
        PromiseOrValue<BytesLike>,
        PromiseOrValue<BigNumberish>
    ]): string;
    encodeFunctionData(functionFragment: "getChainId", values?: undefined): string;
    encodeFunctionData(functionFragment: "getNonce", values: [PromiseOrValue<string>]): string;
    encodeFunctionData(functionFragment: "name", values?: undefined): string;
    decodeFunctionResult(functionFragment: "ERC712_VERSION", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "executeMetaTransaction", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getChainId", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getNonce", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "name", data: BytesLike): Result;
    events: {
        "MetaTransactionExecuted(address,address,bytes)": EventFragment;
        "Unpaused(address)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "MetaTransactionExecuted"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Unpaused"): EventFragment;
}
export interface MetaTransactionExecutedEventObject {
    userAddress: string;
    relayerAddress: string;
    functionSignature: string;
}
export declare type MetaTransactionExecutedEvent = TypedEvent<[
    string,
    string,
    string
], MetaTransactionExecutedEventObject>;
export declare type MetaTransactionExecutedEventFilter = TypedEventFilter<MetaTransactionExecutedEvent>;
export interface UnpausedEventObject {
    account: string;
}
export declare type UnpausedEvent = TypedEvent<[string], UnpausedEventObject>;
export declare type UnpausedEventFilter = TypedEventFilter<UnpausedEvent>;
export interface NativeMetaTransaction extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: NativeMetaTransactionInterface;
    queryFilter<TEvent extends TypedEvent>(event: TypedEventFilter<TEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TEvent>>;
    listeners<TEvent extends TypedEvent>(eventFilter?: TypedEventFilter<TEvent>): Array<TypedListener<TEvent>>;
    listeners(eventName?: string): Array<Listener>;
    removeAllListeners<TEvent extends TypedEvent>(eventFilter: TypedEventFilter<TEvent>): this;
    removeAllListeners(eventName?: string): this;
    off: OnEvent<this>;
    on: OnEvent<this>;
    once: OnEvent<this>;
    removeListener: OnEvent<this>;
    functions: {
        ERC712_VERSION(overrides?: CallOverrides): Promise<[string]>;
        executeMetaTransaction(userAddress: PromiseOrValue<string>, functionSignature: PromiseOrValue<BytesLike>, sigR: PromiseOrValue<BytesLike>, sigS: PromiseOrValue<BytesLike>, sigV: PromiseOrValue<BigNumberish>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<ContractTransaction>;
        getChainId(overrides?: CallOverrides): Promise<[BigNumber]>;
        getNonce(user: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[BigNumber] & {
            nonce: BigNumber;
        }>;
        name(overrides?: CallOverrides): Promise<[string]>;
    };
    ERC712_VERSION(overrides?: CallOverrides): Promise<string>;
    executeMetaTransaction(userAddress: PromiseOrValue<string>, functionSignature: PromiseOrValue<BytesLike>, sigR: PromiseOrValue<BytesLike>, sigS: PromiseOrValue<BytesLike>, sigV: PromiseOrValue<BigNumberish>, overrides?: PayableOverrides & {
        from?: PromiseOrValue<string>;
    }): Promise<ContractTransaction>;
    getChainId(overrides?: CallOverrides): Promise<BigNumber>;
    getNonce(user: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
    name(overrides?: CallOverrides): Promise<string>;
    callStatic: {
        ERC712_VERSION(overrides?: CallOverrides): Promise<string>;
        executeMetaTransaction(userAddress: PromiseOrValue<string>, functionSignature: PromiseOrValue<BytesLike>, sigR: PromiseOrValue<BytesLike>, sigS: PromiseOrValue<BytesLike>, sigV: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;
        getChainId(overrides?: CallOverrides): Promise<BigNumber>;
        getNonce(user: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        name(overrides?: CallOverrides): Promise<string>;
    };
    filters: {
        "MetaTransactionExecuted(address,address,bytes)"(userAddress?: null, relayerAddress?: null, functionSignature?: null): MetaTransactionExecutedEventFilter;
        MetaTransactionExecuted(userAddress?: null, relayerAddress?: null, functionSignature?: null): MetaTransactionExecutedEventFilter;
        "Unpaused(address)"(account?: null): UnpausedEventFilter;
        Unpaused(account?: null): UnpausedEventFilter;
    };
    estimateGas: {
        ERC712_VERSION(overrides?: CallOverrides): Promise<BigNumber>;
        executeMetaTransaction(userAddress: PromiseOrValue<string>, functionSignature: PromiseOrValue<BytesLike>, sigR: PromiseOrValue<BytesLike>, sigS: PromiseOrValue<BytesLike>, sigV: PromiseOrValue<BigNumberish>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<BigNumber>;
        getChainId(overrides?: CallOverrides): Promise<BigNumber>;
        getNonce(user: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;
        name(overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        ERC712_VERSION(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        executeMetaTransaction(userAddress: PromiseOrValue<string>, functionSignature: PromiseOrValue<BytesLike>, sigR: PromiseOrValue<BytesLike>, sigS: PromiseOrValue<BytesLike>, sigV: PromiseOrValue<BigNumberish>, overrides?: PayableOverrides & {
            from?: PromiseOrValue<string>;
        }): Promise<PopulatedTransaction>;
        getChainId(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        getNonce(user: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        name(overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
//# sourceMappingURL=NativeMetaTransaction.d.ts.map