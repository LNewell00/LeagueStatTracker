import { invoke } from "@tauri-apps/api/core";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  module: string;
  message: string;
  data?: any;
}

class DebugLoggerService {
  private inMemoryLogs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  constructor() {
    this.log("info", "System", "Debug Logger initialized");
  }

  public log(level: "info" | "warn" | "error" | "success", module: string, message: string, data?: any) {
    const entry: LogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      module,
      message,
      data,
    };

    this.inMemoryLogs.push(entry);
    if (this.inMemoryLogs.length > 300) {
      this.inMemoryLogs.shift();
    }

    const prefix = `[${entry.timestamp}] [${module}] [${level.toUpperCase()}]`;
    if (level === "error") {
      console.error(prefix, message, data || "");
    } else if (level === "warn") {
      console.warn(prefix, message, data || "");
    } else {
      console.log(prefix, message, data || "");
    }

    this.notify();

    // Mirror to native disk log
    try {
      const dataStr = data ? ` | Data: ${typeof data === "object" ? JSON.stringify(data) : data}` : "";
      invoke("append_debug_log", { entry: `${prefix} ${message}${dataStr}` }).catch(() => {});
    } catch {
      // not in tauri runtime
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.inMemoryLogs];
  }

  public subscribe(cb: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(cb);
    cb([...this.inMemoryLogs]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    const copy = [...this.inMemoryLogs];
    for (const listener of this.listeners) {
      listener(copy);
    }
  }

  public clear() {
    this.inMemoryLogs = [];
    this.notify();
  }

  public async openNativeLog() {
    try {
      await invoke("open_debug_log_file");
    } catch (e) {
      console.warn("Could not open log file:", e);
    }
  }
}

export const logger = new DebugLoggerService();

