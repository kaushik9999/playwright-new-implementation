import * as path from 'node:path';

export const AUTH_STATE_DIR = path.resolve(process.cwd(), '.auth');
export const STORAGE_STATE_FILE = path.join(AUTH_STATE_DIR, 'user.json');
