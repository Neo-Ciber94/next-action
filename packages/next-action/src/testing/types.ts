/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServerFunction = (...args: any[]) => Promise<unknown>;

/**
 * @internal
 */
export type ActionRecord = {
  [key: string]: ActionRecord | ServerFunction;
};
