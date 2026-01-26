/**
 * Level-based logger for Next.js. Respects LOG_LEVEL (server) or NEXT_PUBLIC_LOG_LEVEL (client).
 * In production, defaults to warn (only error + warn) unless overridden.
 */
const LEVELS = { error: 1, warn: 2, info: 3, debug: 4 } as const;
type LevelKey = keyof typeof LEVELS;

function getLevel(): number {
  const isProd = process.env.NODE_ENV === "production";
  const serverLevel = process.env.LOG_LEVEL as LevelKey | undefined;
  const clientLevel = process.env.NEXT_PUBLIC_LOG_LEVEL as LevelKey | undefined;
  const explicit = typeof window !== "undefined" ? clientLevel : serverLevel;
  if (explicit && LEVELS[explicit] != null) return LEVELS[explicit];
  if (isProd) return 2; // warn
  return 3; // info
}

const level = getLevel();

export const logger = {
  error: (...a: unknown[]) => level >= 1 && console.error(...a),
  warn: (...a: unknown[]) => level >= 2 && console.warn(...a),
  info: (...a: unknown[]) => level >= 3 && console.log(...a),
  debug: (...a: unknown[]) => level >= 4 && console.log(...a),
};
