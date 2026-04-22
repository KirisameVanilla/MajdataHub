import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { api } from '../api/client';

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string | null;
  downloadUrlGithub: string | null;
  downloadUrlCnb: string | null;
  fileSize: number;
}

export interface UpdateProgress {
  downloaded: number;
  total: number | null;
  speed: number;
  status: string;
  error: string | null;
}

interface UpdateContextType {
  updateInfo: UpdateInfo | null;
  updateProgress: UpdateProgress | null;
  isChecking: boolean;
  isDownloading: boolean;
  checkForUpdate: () => Promise<void>;
  startDownload: (url: string) => Promise<void>;
  applyUpdate: () => Promise<void>;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const useUpdateContext = () => {
  const context = useContext(UpdateContext);
  if (!context) throw new Error('useUpdateContext must be used within UpdateProvider');
  return context;
};

export const UpdateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const hasCheckedRef = useRef(false);

  const getProxy = (): string | null => {
    const p = localStorage.getItem('httpProxy');
    return p && p.trim() ? p : null;
  };

  // SSE 监听更新进度
  useEffect(() => {
    const es = new EventSource('/api/sse/update-progress');
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as UpdateProgress;
        setUpdateProgress(data);
        if (data.status === 'ready' || data.status === 'failed') {
          setIsDownloading(false);
        }
      } catch {
        // ignore
      }
    };
    es.onerror = () => {
      // auto-reconnect
    };
    return () => es.close();
  }, []);

  const checkForUpdate = async () => {
    setIsChecking(true);
    try {
      const info = await api.post<UpdateInfo>('/api/update/check', { proxy: getProxy() });
      setUpdateInfo(info);
    } catch (e) {
      console.error('检查更新失败:', e);
    } finally {
      setIsChecking(false);
      hasCheckedRef.current = true;
    }
  };

  const startDownload = async (url: string) => {
    setIsDownloading(true);
    setUpdateProgress(null);
    try {
      await api.post<string>('/api/update/download', {
        downloadUrl: url,
        proxy: getProxy(),
      });
    } catch (e) {
      console.error('下载更新失败:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const applyUpdate = async () => {
    try {
      await api.post('/api/update/apply', {});
    } catch (e) {
      console.error('应用更新失败:', e);
    }
  };

  // 启动时自动检查更新
  useEffect(() => {
    checkForUpdate();
  }, []);

  return (
    <UpdateContext.Provider
      value={{
        updateInfo,
        updateProgress,
        isChecking,
        isDownloading,
        checkForUpdate,
        startDownload,
        applyUpdate,
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
};
