import fs from 'fs';
import path from 'path';

export async function ensureDir(dir: string): Promise<void> {
    await fs.promises.mkdir(dir, { recursive: true });
}

export async function moveFile(src: string, dest: string): Promise<void> {
    const directory = path.dirname(dest);
    await ensureDir(directory);
    try {
        await fs.promises.rename(src, dest);
    } catch (err: any) {
        // Fallback for cross-device or Windows locking issues: copy then unlink
        try {
            await fs.promises.copyFile(src, dest);
            await fs.promises.unlink(src);
        } catch (copyErr) {
            throw copyErr;
        }
    }
}

export function join(...parts: string[]): string {
    return path.join(...parts);
}


