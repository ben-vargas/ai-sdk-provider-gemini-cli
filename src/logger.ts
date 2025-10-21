import type { Logger } from './types.js';

/**
 * Default logger that uses console.
 */
const defaultLogger: Logger = {
  debug: (message: string) => console.debug(message),
  info: (message: string) => console.info(message),
  warn: (message: string) => console.warn(message),
  error: (message: string) => console.error(message),
};

/**
 * No-op logger that discards all messages.
 */
const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/**
 * Gets the appropriate logger instance based on the provided option.
 *
 * @param logger - Logger configuration: undefined (default console), false (no logging), or custom Logger
 * @returns Logger instance to use for all logging operations
 */
export function getLogger(logger: Logger | false | undefined): Logger {
  if (logger === false) {
    return noopLogger;
  }

  if (logger === undefined) {
    return defaultLogger;
  }

  return logger;
}

/**
 * Creates a verbose-aware logger that only logs debug/info when verbose is enabled.
 * Warn and error are always logged regardless of verbose setting.
 *
 * When verbose is false (default), debug and info calls are suppressed.
 * When verbose is true, all log levels are passed through to the underlying logger.
 *
 * @param logger - The underlying logger to wrap
 * @param verbose - Whether to enable verbose (debug/info) logging. Defaults to false.
 * @returns A logger that filters debug/info based on verbose mode
 *
 * @example
 * ```typescript
 * const baseLogger = getLogger(undefined); // console logger
 * const verboseLogger = createVerboseLogger(baseLogger, true);
 *
 * verboseLogger.debug('This will be logged');
 * verboseLogger.info('This will be logged');
 * verboseLogger.warn('Always logged');
 * verboseLogger.error('Always logged');
 * ```
 */
export function createVerboseLogger(
  logger: Logger,
  verbose: boolean = false
): Logger {
  if (verbose) {
    // When verbose is enabled, pass through all log levels
    return logger;
  }

  // When verbose is disabled, suppress debug and info, but keep warn and error
  return {
    debug: () => {}, // Suppressed in non-verbose mode
    info: () => {}, // Suppressed in non-verbose mode
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
  };
}
