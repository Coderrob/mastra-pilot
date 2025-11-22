/**
 * Type guard utilities for runtime type checking
 */

/**
 * Type guard to check if object has an execute method
 * @param obj - The object to check
 * @returns True if the object has an execute method
 */
export function hasExecute(
  obj: unknown
): obj is { execute: (...args: unknown[]) => Promise<unknown> } {
  return hasProperty(obj, "execute") && isFunction(obj.execute);
}

/**
 * Type guard to check if object has a getName method
 * @param obj - The object to check
 * @returns True if the object has a getName method
 */
export function hasGetName(obj: unknown): obj is { getName: () => string } {
  return hasProperty(obj, "getName") && isFunction(obj.getName);
}

/**
 * Type guard to check if object has an id property of type string
 * @param obj - The object to check
 * @returns True if the object has an id property of type string
 */
export function hasId(obj: unknown): obj is { id: string } {
  return hasProperty(obj, "id") && isString(obj.id);
}

/**
 * Type guard to check if object has a name property of type string
 * @param obj - The object to check
 * @returns True if the object has a name property of type string
 */
export function hasName(obj: unknown): obj is { name: string } {
  return hasProperty(obj, "name") && isString(obj.name);
}

/**
 * Type guard to check if object has a specific property
 * @param obj - The object to check
 * @param key - The property key to look for
 * @returns True if the object has the specified property
 */
export function hasProperty<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

/**
 * Type guard to check if value is an array
 * @param value - The value to check
 * @returns True if the value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if value is a boolean
 * @param value - The value to check
 * @returns True if the value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Type guard to check if value is defined (not null or undefined)
 * @param value - The value to check
 * @returns True if the value is defined
 */
export function isDefined<T>(value: null | T | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if value is an Error instance
 * @param value - The value to check
 * @returns True if the value is an Error instance
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if value is a function
 * @param value - The value to check
 * @returns True if the value is a function
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

/**
 * Type guard to check if value is null or undefined
 * @param value - The value to check
 * @returns True if the value is null or undefined
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return !isDefined(value);
}

/**
 * Type guard to check if value is a number
 * @param value - The value to check
 * @returns True if the value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

/**
 * Type guard to check if value is a number or boolean (excludes string)
 * @param value - The value to check
 * @returns True if the value is a number or boolean
 */
export function isNumericOrBoolean(value: unknown): value is boolean | number {
  return isNumber(value) || isBoolean(value);
}

/**
 * Type guard to check if value is an object (not null, not array)
 * @param value - The value to check
 * @returns True if the value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if value is a string
 * @param value - The value to check
 * @returns True if the value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}
