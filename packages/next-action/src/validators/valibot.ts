import type { Validator } from "../server";
import {
    parse as valibotParse,
    type BaseSchema,
} from "valibot";

/**
 * Convert a valibot schema to a `Validator<T>`.
 * @param schema The `valibot` schema.
 * @returns An schema compatible with the `Validator<T>` interface.
 */
export default function $valibot<T>(schema: BaseSchema<T>): Validator<T> {
    return {
        parse(value: unknown) {
            return valibotParse(schema, value);
        },
    };
}