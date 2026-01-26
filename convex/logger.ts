/**
 * Level-based logger for Convex. Respects LOG_LEVEL env (error|warn|info|debug).
 * Default: info (debug off). Set LOG_LEVEL=warn or error in production to reduce noise.
 */
const LEVELS = { error: 1, warn: 2, info: 3, debug: 4 } as const;
const level =
  LEVELS[process.env.LOG_LEVEL as keyof typeof LEVELS] ?? 3;

export const logger = {
  error: (...a: unknown[]) => level >= 1 && console.error(...a),
  warn: (...a: unknown[]) => level >= 2 && console.warn(...a),
  info: (...a: unknown[]) => level >= 3 && console.log(...a),
  debug: (...a: unknown[]) => level >= 4 && console.log(...a),
};
