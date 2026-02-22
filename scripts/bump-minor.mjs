import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const tauriConfPath = resolve(root, 'src-tauri', 'tauri.conf.json');
const packageJsonPath = resolve(root, 'package.json');

function bumpMinor(version) {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`无效的版本号格式: ${version}，期望 x.y.z`);
  }
  parts[1] += 1;
  parts[2] = 0;
  return parts.join('.');
}

// 更新 tauri.conf.json
const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf-8'));
const oldVersion = tauriConf.version;
const newVersion = bumpMinor(oldVersion);

tauriConf.version = newVersion;
writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf-8');

// 更新 package.json
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
packageJson.version = newVersion;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

console.log(`版本已从 ${oldVersion} 升级到 ${newVersion}`);
