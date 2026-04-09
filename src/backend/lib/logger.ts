import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = process.env.DATA_DIR || './data';

type LogLevel = 'info' | 'warn' | 'error';

class Logger {
  private logPath: string;
  private maxFileSize = 5 * 1024 * 1024; // 5MB
  private maxLines = 2000;

  constructor() {
    const dataDir = path.resolve(DATA_DIR);
    fs.mkdirSync(dataDir, { recursive: true });
    this.logPath = path.join(dataDir, 'matrix.log');
  }

  private format(level: LogLevel, context: string, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    let line = `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
    if (data !== undefined) {
      line += ` | ${JSON.stringify(data)}`;
    }
    return line;
  }

  private shouldRotate(): boolean {
    try {
      if (!fs.existsSync(this.logPath)) return false;
      const stats = fs.statSync(this.logPath);
      return stats.size > this.maxFileSize;
    } catch {
      return false;
    }
  }

  private rotate(): void {
    try {
      if (!fs.existsSync(this.logPath)) return;
      const content = fs.readFileSync(this.logPath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim());
      const recentLines = lines.slice(-this.maxLines);
      fs.writeFileSync(this.logPath, recentLines.join('\n') + '\n');
    } catch {
      // If rotation fails, just truncate
      fs.writeFileSync(this.logPath, '');
    }
  }

  private write(line: string): void {
    try {
      if (this.shouldRotate()) {
        this.rotate();
      }
      fs.appendFileSync(this.logPath, line + '\n');
    } catch {
      // Silently fail if we can't write
    }
  }

  log(level: LogLevel, context: string, message: string, data?: unknown): void {
    const line = this.format(level, context, message, data);
    this.write(line);

    switch (level) {
      case 'error':
        console.error(line);
        break;
      case 'warn':
        console.warn(line);
        break;
      default:
        console.log(line);
    }
  }

  info(context: string, message: string, data?: unknown): void {
    this.log('info', context, message, data);
  }

  warn(context: string, message: string, data?: unknown): void {
    this.log('warn', context, message, data);
  }

  error(context: string, message: string, data?: unknown): void {
    this.log('error', context, message, data);
  }

  getLogPath(): string {
    return this.logPath;
  }

  getContent(): string {
    try {
      if (!fs.existsSync(this.logPath)) return '';
      return fs.readFileSync(this.logPath, 'utf-8');
    } catch {
      return '';
    }
  }

  clear(): void {
    try {
      fs.writeFileSync(this.logPath, '');
    } catch {
      // Silently fail
    }
  }
}

export const logger = new Logger();
