import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || './data';

function getFilePath(): string {
  return path.join(path.resolve(DATA_DIR), 'local-settings.json');
}

function readAll(): Record<string, string> {
  const filePath = getFilePath();
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, string>): void {
  fs.writeFileSync(getFilePath(), JSON.stringify(data, null, 2), 'utf-8');
}

export const localSettings = {
  get(key: string): string | null {
    return readAll()[key] ?? null;
  },
  set(key: string, value: string): void {
    const all = readAll();
    all[key] = value;
    writeAll(all);
  },
  delete(key: string): void {
    const all = readAll();
    delete all[key];
    writeAll(all);
  },
  getAll(): Record<string, string> {
    return readAll();
  },
};
