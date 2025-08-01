export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stackTrace?: string;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private currentLevel = LogLevel.DEBUG;
  private listeners: Set<(entry: LogEntry) => void> = new Set();

  private createEntry(level: LogLevel, category: string, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      stackTrace: level >= LogLevel.ERROR ? new Error().stack : undefined
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Console output
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const prefix = `[${levelNames[entry.level]}] ${entry.category}:`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.data, entry.stackTrace);
        break;
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(entry));
  }

  debug(category: string, message: string, data?: any) {
    if (this.currentLevel <= LogLevel.DEBUG) {
      this.addLog(this.createEntry(LogLevel.DEBUG, category, message, data));
    }
  }

  info(category: string, message: string, data?: any) {
    if (this.currentLevel <= LogLevel.INFO) {
      this.addLog(this.createEntry(LogLevel.INFO, category, message, data));
    }
  }

  warn(category: string, message: string, data?: any) {
    if (this.currentLevel <= LogLevel.WARN) {
      this.addLog(this.createEntry(LogLevel.WARN, category, message, data));
    }
  }

  error(category: string, message: string, data?: any) {
    this.addLog(this.createEntry(LogLevel.ERROR, category, message, data));
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  onLog(callback: (entry: LogEntry) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  setLevel(level: LogLevel) {
    this.currentLevel = level;
    this.info('LOGGER', `Log level set to ${LogLevel[level]}`);
  }

  clear() {
    this.logs = [];
    this.info('LOGGER', 'Debug logs cleared');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const debugLogger = new DebugLogger();