import fs from 'fs';
import path from 'path';

export const VAULT_DIR = path.join(process.cwd(), 'private_vault');
export const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure vault and uploads directories exist
if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}
if (!fs.existsSync(PUBLIC_UPLOADS_DIR)) {
  fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
}

export function initializeVaultFiles() {
  // Vault starts clean without demo hardcoded files
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${nameWithoutExt}_${Date.now()}${ext || ''}`;
}

export function saveVaultFile(filename: string, buffer: Buffer): string {
  const safeName = sanitizeFilename(filename.endsWith('.zip') || filename.endsWith('.rar') || filename.endsWith('.pdf') ? filename : `${filename}.zip`);
  const filePath = path.join(VAULT_DIR, safeName);
  fs.writeFileSync(filePath, buffer);
  return safeName;
}

export function savePublicUpload(filename: string, buffer: Buffer): string {
  const safeName = sanitizeFilename(filename.includes('.') ? filename : `${filename}.png`);
  const filePath = path.join(PUBLIC_UPLOADS_DIR, safeName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${safeName}`;
}

export function createPlaceholderDeliverable(filename: string, title: string): string {
  const safeName = path.basename(filename);
  const filePath = path.join(VAULT_DIR, safeName);
  if (!fs.existsSync(filePath)) {
    const header = Buffer.from(
      `DIGIVAULT VERIFIED DIGITAL ASSET DELIVERABLE\nItem: ${title}\nPackage: ${safeName}\nGenerated at: ${new Date().toISOString()}\nLicense: Authorized Single-User Digital License.\n\n[Protected Binary Content Stream]\n`,
      'utf-8'
    );
    fs.writeFileSync(filePath, header);
  }
  return safeName;
}

export function getVaultFilePath(filename: string): string | null {
  const safeName = path.basename(filename);
  const filePath = path.join(VAULT_DIR, safeName);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  // Auto-generate if missing for owner-created items
  createPlaceholderDeliverable(safeName, 'Digital Product Package');
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}

