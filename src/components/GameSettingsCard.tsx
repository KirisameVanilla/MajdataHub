import { useState, useEffect } from 'react';
import { Card, LoadingOverlay, Group, Title, Button, Tabs, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSettings, IconDeviceGamepad, IconVolume, IconEye, IconAdjustments, IconCheck, IconAlertCircle, IconBug, IconWorld, IconPlug } from '@tabler/icons-react';
import { GameSettings } from '../types';
import { invoke } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';
import { GameTab } from './GameSettingsCard/GameTab';
import { JudgeTab } from './GameSettingsCard/JudgeTab';
import { DisplayTab } from './GameSettingsCard/DisplayTab';
import { AudioTab } from './GameSettingsCard/AudioTab';
import { DebugTab } from './GameSettingsCard/DebugTab';
import { OnlineTab } from './GameSettingsCard/OnlineTab';
import { IOTab } from './GameSettingsCard/IOTab';

interface GameSettingsCardProps {
  gameFolderPath: string;
  hasGameExe: boolean;
}

export function GameSettingsCard({ gameFolderPath, hasGameExe }: GameSettingsCardProps) {
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // 加载游戏设置
  useEffect(() => {
    const loadGameSettings = async () => {
      if (!gameFolderPath || !hasGameExe) {
        setGameSettings(null);
        return;
      }

      try {
        setIsLoadingSettings(true);
        const settingsPath = await join(gameFolderPath, 'settings.json');
        const fileExists = await invoke<boolean>('file_exists', { path: settingsPath });
        
        if (fileExists) {
          const content = await invoke<string>('read_file_content', { path: settingsPath });
          const settings = JSON.parse(content) as GameSettings;
          setGameSettings(settings);
        } else {
          setGameSettings(null);
        }
      } catch (error) {
        console.error('加载游戏设置失败:', error);
        notifications.show({
          title: '错误',
          message: '加载游戏设置失败: ' + (error as Error).message,
          color: 'red',
          icon: <IconAlertCircle />,
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadGameSettings();
  }, [gameFolderPath, hasGameExe]);

  // 保存游戏设置
  const saveGameSettings = async () => {
    if (!gameFolderPath || !gameSettings) return;

    try {
      setIsSavingSettings(true);
      const settingsPath = await join(gameFolderPath, 'settings.json');
      const content = JSON.stringify(gameSettings, null, 2);
      
      await invoke('write_file_content', {
        path: settingsPath,
        content: content,
      });

      notifications.show({
        title: '保存成功',
        message: '游戏设置已保存',
        color: 'green',
        icon: <IconCheck />,
      });
    } catch (error) {
      console.error('保存游戏设置失败:', error);
      notifications.show({
        title: '保存失败',
        message: '保存游戏设置失败: ' + (error as Error).message,
        color: 'red',
        icon: <IconAlertCircle />,
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 更新设置的辅助函数
  const updateGameSettings = <K extends keyof GameSettings>(
    section: K,
    key: keyof GameSettings[K],
    value: any
  ) => {
    if (!gameSettings) return;
    
    setGameSettings({
      ...gameSettings,
      [section]: {
        ...gameSettings[section],
        [key]: value,
      },
    });
  };

  // 更新音量设置的辅助函数
  const updateVolumeSettings = (key: keyof GameSettings['Audio']['Volume'], value: number) => {
    if (!gameSettings) return;
    
    setGameSettings({
      ...gameSettings,
      Audio: {
        ...gameSettings.Audio,
        Volume: {
          ...gameSettings.Audio.Volume,
          [key]: value,
        },
      },
    });
  };

  if (!hasGameExe || !gameSettings) {
    return <Alert mt="lg" color="red" variant="light" icon={<IconAlertCircle />}>
          游戏设置不可用！请先运行一次游戏。
        </Alert>;
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder mt="sm" className="relative">
      <LoadingOverlay visible={isLoadingSettings || isSavingSettings} />
      
      <Group justify="space-between" mb="lg">
        <Title order={3}>
          <Group gap="sm">
            <IconSettings size={24} />
            <span>游戏设置</span>
          </Group>
        </Title>
        <Button
          onClick={saveGameSettings}
          loading={isSavingSettings}
          leftSection={<IconCheck size={16} />}
        >
          保存设置
        </Button>
      </Group>

      <Tabs defaultValue="game">
        <Tabs.List>
          <Tabs.Tab value="game" leftSection={<IconDeviceGamepad size={16} />}>
            游戏
          </Tabs.Tab>
          <Tabs.Tab value="judge" leftSection={<IconAdjustments size={16} />}>
            判定
          </Tabs.Tab>
          <Tabs.Tab value="display" leftSection={<IconEye size={16} />}>
            显示
          </Tabs.Tab>
          <Tabs.Tab value="audio" leftSection={<IconVolume size={16} />}>
            音频
          </Tabs.Tab>
          <Tabs.Tab value="debug" leftSection={<IconBug size={16} />}>
            调试
          </Tabs.Tab>
          <Tabs.Tab value="online" leftSection={<IconWorld size={16} />}>
            在线
          </Tabs.Tab>
          <Tabs.Tab value="io" leftSection={<IconPlug size={16} />}>
            IO设备
          </Tabs.Tab>
        </Tabs.List>

        {/* 游戏设置 */}
        <Tabs.Panel value="game" pt="md">
          <GameTab gameSettings={gameSettings} updateGameSettings={updateGameSettings} />
        </Tabs.Panel>

        {/* 判定设置 */}
        <Tabs.Panel value="judge" pt="md">
          <JudgeTab gameSettings={gameSettings} updateGameSettings={updateGameSettings} />
        </Tabs.Panel>

        {/* 显示设置 */}
        <Tabs.Panel value="display" pt="md">
          <DisplayTab gameSettings={gameSettings} updateGameSettings={updateGameSettings} />
        </Tabs.Panel>

        {/* 音频设置 */}
        <Tabs.Panel value="audio" pt="md">
          <AudioTab 
            gameSettings={gameSettings} 
            updateVolumeSettings={updateVolumeSettings}
            updateGameSettings={updateGameSettings}
          />
        </Tabs.Panel>

        {/* 调试设置 */}
        <Tabs.Panel value="debug" pt="md">
          <DebugTab 
            gameSettings={gameSettings} 
            setGameSettings={setGameSettings}
            updateGameSettings={updateGameSettings}
          />
        </Tabs.Panel>

        {/* 在线设置 */}
        <Tabs.Panel value="online" pt="md">
          <OnlineTab 
            gameSettings={gameSettings} 
            setGameSettings={setGameSettings}
            updateGameSettings={updateGameSettings}
          />
        </Tabs.Panel>

        {/* IO设备设置 */}
        <Tabs.Panel value="io" pt="md">
          <IOTab gameSettings={gameSettings} setGameSettings={setGameSettings} />
        </Tabs.Panel>
      </Tabs>
    </Card>
  );
}
