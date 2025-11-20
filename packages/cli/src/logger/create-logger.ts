import pino from "pino";
import { ILogger } from "@repo/core";

export function createLogger(level: string = "info"): ILogger {
  return pino({ level });
}
