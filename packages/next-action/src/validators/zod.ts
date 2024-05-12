import type { Validator } from "../server";
import type { ZodType } from "zod";

/**
 * Convert a zod schema to a `Validator<T>`.
 * @param schema The `zod` schema.
 * @returns An schema compatible with the `Validator<T>` interface.
 * @remarks You don't need to use this, schema is already a valid `Validator<T>`.
 */
export default function $zod<T>(schema: ZodType<T>): Validator<T> {
    return schema;
}