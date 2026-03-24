import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { notifications } from '@mantine/notifications';

export function useAutoUpdate() {
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    if (isChecking) return;

    setIsChecking(true);
    try {
      const update = await check();

      if (update) {
        setUpdateAvailable(true);
        const { version } = update;

        notifications.show({
          title: '发现新版本',
          message: `版本 ${version} 可用，正在下载...`,
          color: 'blue',
          autoClose: false,
          id: 'update-notification',
        });
        let downloaded = 0;
        let contentLength: number | undefined = 0;

        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case 'Started':
              contentLength = event.data.contentLength;
              console.log(`started downloading ${event.data.contentLength} bytes`);
              break;
            case 'Progress':
              downloaded += event.data.chunkLength;
              console.log(`downloaded ${downloaded} from ${contentLength}`);
              break;
            case 'Finished':
              console.log('download finished');
              break;
          }
        });

        notifications.update({
          id: 'update-notification',
          title: '更新已下载',
          message: '应用将在 3 秒后重启以完成更新',
          color: 'green',
          autoClose: 3000,
        });

        // 3 秒后重启应用
        setTimeout(async () => {
          await relaunch();
        }, 3000);
      } else {
        console.log('当前已是最新版本');
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

  return {
    isChecking,
    updateAvailable,
    checkForUpdates,
  };
}
