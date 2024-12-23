export const isArray = (obj: unknown) => {
  return Array.isArray(obj);
};

export const isObject = (obj: unknown) => {
  return obj !== null && typeof obj === "object";
};

export const hasChanged = (value: any, oldValue: any): boolean => {
  return !Object.is(value, oldValue);
};

export const isFunction = (obj: any) => {
  return typeof obj === "function";
};
