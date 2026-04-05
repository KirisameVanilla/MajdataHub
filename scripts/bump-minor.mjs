import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const packageJsonPath = resolve(root, 'package.json');
const readmePath = resolve(root, 'README.md');
const cargoTomlPath = resolve(root, 'src-server', 'Cargo.toml');

function bumpMinor(version) {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`无效的版本号格式: ${version}，期望 x.y.z`);
  }
  parts[1] += 1;
  parts[2] = 0;
  return parts.join('.');
}

// 获取旧版本号
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const oldVersion = packageJson.version;
const newVersion = bumpMinor(oldVersion);

// 更新 package.json
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

