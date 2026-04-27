import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { FileChecksum } from '../utils/hash';
import { listen } from '@tauri-apps/api/event';

interface DownloadContextType {
  isDownloading: boolean;
  downloadProgress: number;
  downloadedBytes: number;
  totalBytes: number | null;
  downloadSpeed: number;
  setIsDownloading: (value: boolean) => void;
  setDownloadProgress: (value: number) => void;
  resetDownloadProgress: () => void;
  isUpdating: boolean;
  updateList: FileChecksum[];
  setIsUpdating: (value: boolean) => void;
  setUpdateList: (value: FileChecksum[]) => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export const useDownloadContext = () => {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownloadContext必须在DownloadProvider内部使用');
  }
  return context;
};

interface DownloadProviderProps {
  children: ReactNode;
}

export const DownloadProvider: React.FC<DownloadProviderProps> = ({ children }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState<number | null>(null);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateList, setUpdateList] = useState<FileChecksum[]>([]);
  // 保存上一次的速度用于平滑显示
  const lastSpeedRef = useRef(0);

  const resetDownloadProgress = () => {
    setDownloadProgress(0);
    setDownloadedBytes(0);
    setTotalBytes(null);
    setDownloadSpeed(0);
    lastSpeedRef.current = 0;
  };

  // 全局监听下载进度事件，Context 生命周期内始终有效
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    listen<{ downloaded: number; total: number | null; speed: number }>(
      'download_file_progress',
      (event) => {
        const { downloaded, total, speed } = event.payload;
        setDownloadedBytes(downloaded);
        setTotalBytes(total ?? null);
        if (speed > 0) {
          lastSpeedRef.current = speed;
          setDownloadSpeed(speed);
        } else if (lastSpeedRef.current > 0) {
          // 最后一次事件 speed=0，保留上次速度直到下载完成
          setDownloadSpeed(lastSpeedRef.current);
        }
        if (total && total > 0) {
          setDownloadProgress(Math.round((downloaded / total) * 100));
        }
      }
    ).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, []);

  return (
    <DownloadContext.Provider value={{
      isDownloading, downloadProgress, downloadedBytes, totalBytes, downloadSpeed,
      setIsDownloading, setDownloadProgress, resetDownloadProgress,
      isUpdating, updateList, setIsUpdating, setUpdateList,
    }}>
      {children}
    </DownloadContext.Provider>
  );
};
