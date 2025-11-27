"use strict";
/**
 * Type Tests
 * Ensures type safety with runtime checks
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const typed_errors_1 = require("../utils/typed-errors");
const common_types_1 = require("../utils/common-types");
describe('Type Tests', () => {
    describe('Typed Errors', () => {
        it('should have correct types', () => {
            const error = new typed_errors_1.ValidationError('Invalid input', 'email');
            (0, vitest_1.expectTypeOf)(error.statusCode).toBeNumber();
            (0, vitest_1.expectTypeOf)(error.statusCode).toEqualTypeOf();
            (0, vitest_1.expectTypeOf)(error.errorCode).toBeString();
            (0, vitest_1.expectTypeOf)(error.message).toBeString();
        });
        it('should allow type narrowing', () => {
            function handleError(error) {
                if (error instanceof typed_errors_1.ApiError) {
                    return error.errorCode;
                }
                return 'UNKNOWN';
            }
            const error = new typed_errors_1.NotFoundError('Not found', 'job', '123');
            (0, vitest_1.expectTypeOf)(handleError(error)).toBeString();
        });
    });
    describe('Common Types', () => {
        it('Result type should work correctly', () => {
            const success = { success: true, data: 'test' };
            const failure = { success: false, error: new Error('failed') };
            (0, vitest_1.expectTypeOf)(success.success).toBeBoolean();
            if (success.success) {
                (0, vitest_1.expectTypeOf)(success.data).toBeString();
            }
            else {
                (0, vitest_1.expectTypeOf)(success.error).toBeInstanceOf(Error);
            }
        });
        it('Type guards should narrow types', () => {
            const value = 'test';
            if ((0, common_types_1.isString)(value)) {
                (0, vitest_1.expectTypeOf)(value).toBeString();
            }
            const num = 123;
            if ((0, common_types_1.isNumber)(num)) {
                (0, vitest_1.expectTypeOf)(num).toBeNumber();
            }
            const obj = { key: 'value' };
            if ((0, common_types_1.isPlainObject)(obj)) {
                (0, vitest_1.expectTypeOf)(obj).toMatchTypeOf();
            }
        });
    });
});
//# sourceMappingURL=type-tests.js.map