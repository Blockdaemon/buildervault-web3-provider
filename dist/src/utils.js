"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseToFunction = void 0;
function promiseToFunction(func) {
    let exceptionThrown = false;
    const promise = func().catch((e) => {
        exceptionThrown = true;
        return e;
    });
    return async () => {
        const result = await promise;
        if (exceptionThrown)
            throw result;
    };
}
exports.promiseToFunction = promiseToFunction;
//# sourceMappingURL=utils.js.map