import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../api/client';

interface AppPaths {
  exe_path: string;
  exe_folder_path: string;
  game_folder_path: string;
  maicharts_path: string;
  skins_path: string;
}

interface PathContextType {
  appExeFolderPath: string | null;
  defaultGameFolderPath: string | null;
  maichartsPath: string | null;
  skinsPath: string | null;
  setGameFolderPath: (path: string) => void;
  reloadKey: number;
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
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setGameFolderPath = (path: string) => {
    localStorage.setItem('gamePath', path);
    setDefaultGameFolderPath(prevPath => {
      if (prevPath !== path) {
        setReloadKey(prev => prev + 1);
      }
      return path;
    });
    setMaichartsPath(path ? `${path}\\MaiCharts` : null);
    setSkinsPath(path ? `${path}\\Skins` : null);
  };

  useEffect(() => {
    const loadPaths = async () => {
      try {
        setIsLoading(true);

        const savedGamePath = localStorage.getItem('gamePath');
        const paths = await api.get<AppPaths>('/api/paths');

        const gamePath = savedGamePath || paths.game_folder_path;

        setAppExeFolderPath(paths.exe_folder_path);

        setGameFolderPath(gamePath);
        console.log('游戏路径已设置为:', gamePath);

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
      setGameFolderPath,
      reloadKey,
      isLoading,
      error,
    }}>
      {children}
    </PathContext.Provider>
  );
};
