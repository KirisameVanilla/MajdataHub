import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { notifications } from '@mantine/notifications';

interface UpdateContextType {
  isChecking: boolean;
  updateAvailable: boolean;
  updateInfo: Update | null;
  isInstalling: boolean;
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<Update | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // 应用启动时自动检查更新
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    if (isChecking) return;

    setIsChecking(true);
    try {
      const update = await check();

      if (update) {
        setUpdateAvailable(true);
        setUpdateInfo(update);
        const { version } = update;

        // 显示提醒，引导用户去设置页面更新
        notifications.show({
          title: '发现新版本',
          message: `版本 ${version} 已可用，请前往设置页面进行更新`,
          color: 'blue',
          autoClose: 8000,
          id: 'update-available-notification',
        });
      } else {
        console.log('当前已是最新版本');
        setUpdateAvailable(false);
        setUpdateInfo(null);
      }
    } catch (error) {
      console.error('检查更新失败:', error);
      notifications.show({
        title: '更新检查失败',
        message: String(error),
        color: 'red',
        autoClose: 5000,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const installUpdate = async () => {
    if (!updateInfo || isInstalling) return;

    setIsInstalling(true);
    const { version } = updateInfo;

    try {
      notifications.show({
        title: '开始更新',
        message: `正在下载版本 ${version}...`,
        color: 'blue',
        autoClose: false,
        id: 'update-installing-notification',
      });

      let downloaded = 0;
      let contentLength: number | undefined = 0;

      await updateInfo.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength;
            console.log(`started downloading ${event.data.contentLength} bytes`);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            const progress = contentLength ? Math.round((downloaded / contentLength) * 100) : 0;
            notifications.update({
              id: 'update-installing-notification',
              title: '下载中',
              message: `下载进度：${progress}%`,
              color: 'blue',
              autoClose: false,
            });
            console.log(`downloaded ${downloaded} from ${contentLength}`);
            break;
          case 'Finished':
            console.log('download finished');
            break;
        }
      });

      notifications.update({
        id: 'update-installing-notification',
        title: '更新已下载',
        message: '应用将在 3 秒后重启以完成更新',
        color: 'green',
        autoClose: 3000,
      });

      // 3 秒后重启应用
      setTimeout(async () => {
        await relaunch();
      }, 3000);
    } catch (error) {
      console.error('安装更新失败:', error);
      notifications.update({
        id: 'update-installing-notification',
        title: '更新失败',
        message: String(error),
        color: 'red',
        autoClose: 5000,
      });
      setIsInstalling(false);
    }
  };

  return (
    <UpdateContext.Provider
      value={{
        isChecking,
        updateAvailable,
        updateInfo,
        isInstalling,
        checkForUpdates,
        installUpdate,
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdateContext() {
  const context = useContext(UpdateContext);
  if (context === undefined) {
    throw new Error('useUpdateContext must be used within an UpdateProvider');
  }
  return context;
}
