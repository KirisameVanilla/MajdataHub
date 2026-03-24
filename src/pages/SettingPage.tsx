import { useState, useEffect } from 'react';
import { Container, Title, Text, Card, TextInput, Button, Group, Stack, ActionIcon, Select, Badge, Loader } from '@mantine/core';
import { IconFolder, IconDeviceFloppy, IconFolderOpen, IconNetwork, IconCloudDownload, IconRefresh, IconDownload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { open } from '@tauri-apps/plugin-dialog';
import { getVersion } from '@tauri-apps/api/app';
import { usePathContext, useUpdateContext } from '../contexts';

export function SettingPage() {
  const { appExeFolderPath, defaultGameFolderPath } = usePathContext();
  const { isChecking, updateAvailable, updateInfo, isInstalling, checkForUpdates, installUpdate } = useUpdateContext();

  if (!appExeFolderPath || !defaultGameFolderPath) {
    return (
      <Container size="xl" py="xl">
        <Text c="red">无法获取应用程序路径，设置页面无法使用。</Text>
      </Container>
    );
  }

  const [gamePath, setGamePath] = useState<string>(defaultGameFolderPath);
  const [httpProxy, setHttpProxy] = useState<string>('');
  const [downloadSource, setDownloadSource] = useState<string>('cnb');
  const [currentVersion, setCurrentVersion] = useState<string>('');

  useEffect(() => {
    const savedPath = localStorage.getItem('gamePath');
    if (savedPath) {
      setGamePath(savedPath);
    }
    const savedProxy = localStorage.getItem('httpProxy');
    if (savedProxy) {
      setHttpProxy(savedProxy);
    }
    const savedSource = localStorage.getItem('downloadSource');
    if (savedSource) {
      setDownloadSource(savedSource);
    }

    // 获取当前应用版本
    getVersion().then(version => {
      setCurrentVersion(version);
    }).catch(error => {
      console.error('获取版本号失败:', error);
    });
  }, []);

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '选择游戏目录',
      });
      
      if (selected && typeof selected === 'string') {
        setGamePath(selected);
      }
    } catch (error) {
      notifications.show({
        title: '错误',
        message: '无法打开文件选择器',
        color: 'red',
      });
    }
  };

  const handleSave = () => {
    localStorage.setItem('gamePath', gamePath);
    localStorage.setItem('httpProxy', httpProxy);
    localStorage.setItem('downloadSource', downloadSource);
    notifications.show({
      title: '保存成功',
      message: '设置已保存',
      color: 'green',
    });
  };

  return (
    <Container size="xl" py="xl">
      <div className="mb-8">
        <Title order={1}>
          设置
        </Title>
        <Text c="dimmed" size="lg">
          配置本工具的各项参数
        </Text>
      </div>

      {/* 版本管理 Card */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <div>
            <Text size="lg" fw={600}>版本管理</Text>
            <Text size="sm" c="dimmed">查看当前版本并检查更新</Text>
          </div>

          <Group justify="space-between" align="center">
            <div>
              <Text size="sm" c="dimmed">当前版本</Text>
              <Text size="lg" fw={500}>{currentVersion || '加载中...'}</Text>
            </div>
            {updateAvailable && updateInfo && (
              <Badge color="blue" size="lg">
                新版本 {updateInfo.version} 可用
              </Badge>
            )}
            {!updateAvailable && !isChecking && currentVersion && (
              <Badge color="green" size="lg">
                已是最新版本
              </Badge>
            )}
          </Group>

          <Group justify="flex-end">
            <Button
              leftSection={isChecking ? <Loader size={18} /> : <IconRefresh size={18} />}
              onClick={checkForUpdates}
              variant="light"
              disabled={isChecking || isInstalling}
            >
              {isChecking ? '检查中...' : '检查更新'}
            </Button>
            {updateAvailable && (
              <Button
                leftSection={isInstalling ? <Loader size={18} /> : <IconDownload size={18} />}
                onClick={installUpdate}
                color="blue"
                disabled={isInstalling || isChecking}
              >
                {isInstalling ? '更新中...' : '立即更新'}
              </Button>
            )}
          </Group>
        </Stack>
      </Card>

      <Card shadow="sm" mt='sm' padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <TextInput
            leftSection={<IconFolder size={18} />}
            rightSection={
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={handleSelectFolder}
                title="选择文件夹"
              >
                <IconFolderOpen size={18} />
              </ActionIcon>
            }
            placeholder="./game"
            value={gamePath}
            onChange={(event) => setGamePath(event.currentTarget.value)}
            size="md"
            label="游戏目录路径"
            description="点击右侧图标选择游戏资源所在的文件夹路径"
          />

          <TextInput
            leftSection={<IconNetwork size={18} />}
            placeholder="例如：http://127.0.0.1:7890"
            value={httpProxy}
            onChange={(event) => setHttpProxy(event.currentTarget.value)}
            size="md"
            label="HTTP 代理"
            description="留空表示不使用代理，支持 http:// 和 https:// 格式"
          />

          <Select
            leftSection={<IconCloudDownload size={18} />}
            label="下载源"
            description="选择游戏文件的下载来源，国内用户推荐使用 CNB"
            data={[
              { value: 'github', label: 'GitHub（国际）' },
              { value: 'cnb', label: 'CNB（国内）' },
            ]}
            value={downloadSource}
            onChange={(value) => setDownloadSource(value ?? 'cnb')}
            size="md"
            allowDeselect={false}
          />

          <Group justify="flex-end">
            <Button
              leftSection={<IconDeviceFloppy size={18} />}
              onClick={handleSave}
              color="blue"
            >
              保存设置
            </Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}
