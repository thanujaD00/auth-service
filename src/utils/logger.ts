// A simple logger implementation

export const logger = {
  error: (...args: any[]) => {
    console.error(...args);
  },
  info: (...args: any[]) => {
    console.log(...args);
  },
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  debug: (...args: any[]) => {
    console.debug(...args);
  },
};