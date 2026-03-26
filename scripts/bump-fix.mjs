import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const tauriConfPath = resolve(root, 'src-tauri', 'tauri.conf.json');
const tauriBuildConfPath = resolve(root, 'src-tauri', 'tauri.build.conf.json');
const packageJsonPath = resolve(root, 'package.json');
const readmePath = resolve(root, 'README.md');
const cargoTomlPath = resolve(root, 'src-tauri', 'Cargo.toml');

function bumpMinor(version) {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`无效的版本号格式: ${version}，期望 x.y.z`);
  }
  parts[2] += 1;
  return parts.join('.');
}

const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf-8'));
const tauriBuildConf = JSON.parse(readFileSync(tauriBuildConfPath, 'utf-8'));

const oldVersion = tauriConf.version;
const newVersion = bumpMinor(oldVersion);

// 更新 tauri.conf.json
tauriConf.version = newVersion;
writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf-8');

// 更新 tauri.build.conf.json
tauriBuildConf.version = newVersion;
writeFileSync(tauriBuildConfPath, JSON.stringify(tauriBuildConf, null, 2) + '\n', 'utf-8');

// 更新 package.json
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
packageJson.version = newVersion;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

// 更新 Cargo.toml
const cargoToml = readFileSync(cargoTomlPath, 'utf-8');
const updatedCargoToml = cargoToml.replace(
  /^(version\s*=\s*")([^"]+)(")/m,
  `$1${newVersion}$3`
);
writeFileSync(cargoTomlPath, updatedCargoToml, 'utf-8');

// 更新 README.md 版本徽章
const readme = readFileSync(readmePath, 'utf-8');
const updatedReadme = readme.replace(
  /https:\/\/img\.shields\.io\/badge\/version-[^-]+-blue\.svg/,
  `https://img.shields.io/badge/version-${newVersion}-blue.svg`
);
writeFileSync(readmePath, updatedReadme, 'utf-8');

console.log(`版本已从 ${oldVersion} 升级到 ${newVersion}`);
