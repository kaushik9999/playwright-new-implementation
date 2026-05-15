import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export async function readText(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

export async function writeText(filePath: string, data: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, data, 'utf-8');
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function removeDir(dirPath: string): Promise<void> {
  await fs.rm(dirPath, { recursive: true, force: true });
}
