import { useState, useEffect } from 'react';
import { Container, Title, Text, Card, TextInput, Button, Group, Stack, Select, Badge, Progress, Divider } from '@mantine/core';
import { IconFolder, IconDeviceFloppy, IconNetwork, IconCloudDownload, IconFolderOpen, IconRefresh, IconDownload, IconPlayerPlay } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { usePathContext, useUpdateContext } from '../contexts';
import { api } from '../api/client';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SettingPage() {
  const { defaultGameFolderPath, setGameFolderPath } = usePathContext();
  const { updateInfo, updateProgress, isChecking, isDownloading, checkForUpdate, startDownload, applyUpdate } = useUpdateContext();

  const [gamePath, setGamePath] = useState<string>(defaultGameFolderPath ?? '');
  const [httpProxy, setHttpProxy] = useState<string>('');
  const [downloadSource, setDownloadSource] = useState<string>('cnb');
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [isPickingFolder, setIsPickingFolder] = useState(false);

  useEffect(() => {
    const savedProxy = localStorage.getItem('httpProxy');
    if (savedProxy !== null) {
      setHttpProxy(savedProxy);
    }
    const savedSource = localStorage.getItem('downloadSource');
    if (savedSource !== null) {
      setDownloadSource(savedSource);
    }

    api.get<string>('/api/version').then(version => {
      setCurrentVersion(version);
    }).catch(error => {
      console.error('获取版本号失败:', error);
    });
  }, []);

  const handleSave = () => {
    setGameFolderPath(gamePath);
    localStorage.setItem('httpProxy', httpProxy);
    localStorage.setItem('downloadSource', downloadSource);
    notifications.show({
      title: '保存成功',
      message: '设置已保存，部分设置需要重启应用后生效',
      color: 'green',
    });
  };

  const handlePickFolder = async () => {
    setIsPickingFolder(true);
    try {
      const selectedPath = await api.post<string>('/api/fs/pick-folder', {});
      setGamePath(selectedPath);
      notifications.show({
        title: '选择成功',
        message: `已选择文件夹: ${selectedPath}`,
        color: 'blue',
      });
    } catch (error) {
      console.error('选择文件夹失败:', error);
      notifications.show({
        title: '选择失败',
        message: error instanceof Error ? error.message : '未知错误',
        color: 'red',
      });
    } finally {
      setIsPickingFolder(false);
    }
  };

  const handleDownloadUpdate = () => {
    if (!updateInfo) return;
    const url = downloadSource === 'cnb' && updateInfo.downloadUrlCnb
      ? updateInfo.downloadUrlCnb
      : updateInfo.downloadUrlGithub;
    if (url) startDownload(url);
  };

  const progressPercent = updateProgress && updateProgress.total
    ? Math.round((updateProgress.downloaded / updateProgress.total) * 100)
    : 0;

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

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <div>
              <Text size="lg" fw={600}>版本信息</Text>
              <Text size="sm" c="dimmed">当前版本</Text>
            </div>
            <Badge color="blue" size="lg">
              v{currentVersion || '...'}
            </Badge>
          </Group>

          <Divider />

          {isChecking && (
            <Group gap="xs">
              <IconRefresh size={16} className="animate-spin" />
              <Text size="sm" c="dimmed">正在检查更新...</Text>
            </Group>
          )}

          {!isChecking && updateInfo && !updateInfo.hasUpdate && (
            <Group justify="space-between">
              <Text size="sm" c="green">已是最新版本</Text>
              <Button
                leftSection={<IconRefresh size={16} />}
                variant="light"
                size="xs"
                onClick={checkForUpdate}
              >
                重新检查
              </Button>
            </Group>
          )}

          {!isChecking && updateInfo && updateInfo.hasUpdate && (
            <>
              <Group justify="space-between">
                <Text size="sm">
                  发现新版本: <Text span fw={600}>v{updateInfo.latestVersion}</Text>
                </Text>
                <Badge color="orange">有更新</Badge>
              </Group>

              {updateInfo.releaseNotes && (
                <Text size="xs" c="dimmed" lineClamp={4}>
                  {updateInfo.releaseNotes}
                </Text>
              )}

              {isDownloading && updateProgress && updateProgress.status === 'downloading' && (
                <Stack gap="xs">
                  <Progress
                    value={progressPercent}
                    animated
                    size="lg"
                    color="blue"
                  />
                  <Text size="xs" c="dimmed">
                    {formatBytes(updateProgress.downloaded)}
                    {updateProgress.total ? ` / ${formatBytes(updateProgress.total)}` : ''}
                    {updateProgress.speed > 0 ? ` — ${formatBytes(updateProgress.speed)}/s` : ''}
                  </Text>
                </Stack>
              )}

              {updateProgress?.status === 'ready' && (
                <Button
                  leftSection={<IconPlayerPlay size={16} />}
                  color="green"
                  onClick={applyUpdate}
                >
                  下载完成，点击重启应用
                </Button>
              )}

              {updateProgress?.status === 'failed' && (
                <Group justify="space-between">
                  <Text size="sm" c="red">下载失败: {updateProgress.error}</Text>
                  <Button
                    leftSection={<IconRefresh size={16} />}
                    variant="light"
                    size="xs"
                    color="red"
                    onClick={handleDownloadUpdate}
                  >
                    重试
                  </Button>
                </Group>
              )}

              {!isDownloading && updateProgress?.status !== 'downloading' && updateProgress?.status !== 'ready' && (
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleDownloadUpdate}
                >
                  下载更新 ({downloadSource === 'cnb' ? 'CNB' : 'GitHub'})
                </Button>
              )}
            </>
          )}

          {!isChecking && !updateInfo && (
            <Group justify="flex-end">
              <Button
                leftSection={<IconRefresh size={16} />}
                variant="light"
                onClick={checkForUpdate}
              >
                检查更新
              </Button>
            </Group>
          )}
        </Stack>
      </Card>

      <Card shadow="sm" mt='sm' padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} mb="xs">游戏目录路径</Text>
            <Text size="sm" c="dimmed" mb="md">输入游戏资源所在的文件夹路径</Text>
            <Group gap="xs">
              <TextInput
                leftSection={<IconFolder size={18} />}
                placeholder="./game"
                value={gamePath}
                onChange={(event) => setGamePath(event.currentTarget.value)}
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                leftSection={<IconFolderOpen size={18} />}
                onClick={handlePickFolder}
                loading={isPickingFolder}
                variant="light"
              >
                浏览
              </Button>
            </Group>
          </div>

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
