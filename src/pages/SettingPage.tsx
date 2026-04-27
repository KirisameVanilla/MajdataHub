import { useState, useEffect } from 'react';
import { Container, Title, Text, Card, TextInput, Button, Group, Stack, Select, Badge } from '@mantine/core';
import { IconFolder, IconDeviceFloppy, IconNetwork, IconCloudDownload, IconFolderOpen } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { usePathContext } from '../contexts';
import { api } from '../api/client';

export function SettingPage() {
  const { defaultGameFolderPath } = usePathContext();

  const [gamePath, setGamePath] = useState<string>(defaultGameFolderPath ?? '');
  const [httpProxy, setHttpProxy] = useState<string>('');
  const [downloadSource, setDownloadSource] = useState<string>('cnb');
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [isPickingFolder, setIsPickingFolder] = useState(false);

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

    api.get<string>('/api/version').then(version => {
      setCurrentVersion(version);
    }).catch(error => {
      console.error('获取版本号失败:', error);
    });
  }, []);

  const handleSave = () => {
    localStorage.setItem('gamePath', gamePath);
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
