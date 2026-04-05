import { api } from '../api/client';

const ROOT_EXCLUDE_FILES = [
  "smallest_hashes.json",
  "hashes.json",
  "hash.ts",
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.json",
  ".gitignore",
  ".github",
  ".git",
  "node_modules",
  "MaiCharts",
  "Skins"
];

export interface FileChecksum {
  name: string;
  filePath: string;
  checksum: string;
}

export async function calculateChecksums(
  directory: string,
  excludeFiles: string[] = ROOT_EXCLUDE_FILES
): Promise<FileChecksum[]> {
  try {
    const result = await api.post<FileChecksum[]>('/api/checksums/calculate', {
      directory,
      excludeFiles,
    });
    return result;
  } catch (error) {
    console.error('计算校验和时出错:', error);
    throw error;
  }
}

export async function saveChecksumsToFile(
  directory: string,
  outputFile: string,
  excludeFiles: string[] = ROOT_EXCLUDE_FILES
): Promise<string> {
  try {
    const result = await api.post<string>('/api/checksums/save', {
      directory,
      outputFile,
      excludeFiles,
    });
    console.log(result);
    return result;
  } catch (error) {
    console.error('保存校验和时出错:', error);
    throw error;
  }
}
