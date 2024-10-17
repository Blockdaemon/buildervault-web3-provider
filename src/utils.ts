
export function promiseToFunction(func: () => Promise<any>): () => Promise<void> {
    let exceptionThrown = false

    const promise = func().catch((e) => {
        exceptionThrown = true
        return e
    });

    return async () => {
        const result = await promise
        if (exceptionThrown)
            throw result
    };
}
