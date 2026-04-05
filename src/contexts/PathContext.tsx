import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../api/client';

interface AppPaths {
  exePath: string;
  exeFolderPath: string;
  gameFolderPath: string;
  maichartsPath: string;
  skinsPath: string;
}

interface PathContextType {
  appExeFolderPath: string | null;
  defaultGameFolderPath: string | null;
  maichartsPath: string | null;
  skinsPath: string | null;
  isLoading: boolean;
  error: string | null;
}

const PathContext = createContext<PathContextType | undefined>(undefined);

export const usePathContext = () => {
  const context = useContext(PathContext);
  if (!context) {
    throw new Error('usePathContext必须在PathProvider内部使用');
  }
  return context;
};

interface PathProviderProps {
  children: ReactNode;
}

export const PathProvider: React.FC<PathProviderProps> = ({ children }) => {
  const [appExeFolderPath, setAppExeFolderPath] = useState<string | null>(null);
  const [defaultGameFolderPath, setDefaultGameFolderPath] = useState<string | null>(null);
  const [maichartsPath, setMaichartsPath] = useState<string | null>(null);
  const [skinsPath, setSkinsPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPaths = async () => {
      try {
        setIsLoading(true);

        const savedGamePath = localStorage.getItem('gamePath');
        const paths = await api.get<AppPaths>('/api/paths');

        const gamePath = savedGamePath || paths.gameFolderPath;

        setAppExeFolderPath(paths.exeFolderPath);
        setDefaultGameFolderPath(gamePath);
        setMaichartsPath(gamePath ? `${gamePath}\\MaiCharts` : null);
        setSkinsPath(gamePath ? `${gamePath}\\Skins` : null);

        setError(null);
      } catch (err) {
        console.error('加载路径失败:', err);
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setIsLoading(false);
      }
    };

    loadPaths();
  }, []);

  return (
    <PathContext.Provider value={{
      appExeFolderPath,
      defaultGameFolderPath,
      maichartsPath,
      skinsPath,
      isLoading,
      error,
    }}>
      {children}
    </PathContext.Provider>
  );
};
