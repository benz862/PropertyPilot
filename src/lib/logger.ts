type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

export interface LogContext {
  correlationId?: string;
  userId?: string;
  propertyId?: string;
  organizationId?: string;
  [key: string]: unknown;
}

export interface LogEntry extends LogContext {
  level: LogLevel;
  message: string;
  timestamp: string;
}

function write(entry: LogEntry) {
  if (process.env.NODE_ENV === "test") return;

  const payload = JSON.stringify(entry);
  if (entry.level === "error" || entry.level === "critical") {
    process.stderr.write(`${payload}\n`);
    return;
  }
  process.stdout.write(`${payload}\n`);
}

export const logger = {
  debug(message: string, context: LogContext = {}) {
    if (process.env.NODE_ENV === "production") return;
    write({ level: "debug", message, timestamp: new Date().toISOString(), ...context });
  },
  info(message: string, context: LogContext = {}) {
    write({ level: "info", message, timestamp: new Date().toISOString(), ...context });
  },
  warn(message: string, context: LogContext = {}) {
    write({ level: "warn", message, timestamp: new Date().toISOString(), ...context });
  },
  error(message: string, context: LogContext = {}) {
    write({ level: "error", message, timestamp: new Date().toISOString(), ...context });
  },
  critical(message: string, context: LogContext = {}) {
    write({ level: "critical", message, timestamp: new Date().toISOString(), ...context });
  },
};
