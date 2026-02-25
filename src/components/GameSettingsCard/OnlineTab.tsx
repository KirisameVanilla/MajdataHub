import { Stack, Switch, TextInput, PasswordInput, Text, Select } from '@mantine/core';
import { GameSettings } from '../../types';

interface OnlineTabProps {
  gameSettings: GameSettings;
  setGameSettings: (settings: GameSettings) => void;
  updateGameSettings: <K extends keyof GameSettings>(
    section: K,
    key: keyof GameSettings[K],
    value: any
  ) => void;
}

export function OnlineTab({ gameSettings, setGameSettings, updateGameSettings }: OnlineTabProps) {
  return (
    <Stack gap="md">
      <Switch
        label="启用在线功能"
        checked={gameSettings.Online.Enable}
        onChange={(event) => updateGameSettings('Online', 'Enable', event.currentTarget.checked)}
      />

      <Switch
        label="使用代理"
        checked={gameSettings.Online.UseProxy}
        onChange={(event) => updateGameSettings('Online', 'UseProxy', event.currentTarget.checked)}
      />

      {gameSettings.Online.UseProxy && (
        <TextInput
          label="代理地址"
          description="HTTP/HTTPS 代理服务器地址"
          placeholder="http://127.0.0.1:7890"
          value={gameSettings.Online.Proxy}
          onChange={(event) => updateGameSettings('Online', 'Proxy', event.currentTarget.value)}
        />
      )}

      <Text size="md" fw={500} mt="md">API 端点配置</Text>

      {gameSettings.Online.ApiEndpoints.length > 0 && (
        <Stack gap="md">
          <Select
            label="API 端点预设"
            description="选择 Majnet 服务器或使用自定义 URL"
            value={
              gameSettings.Online.ApiEndpoints[0].Url === 'https://majdata.net/api3/api/' 
                ? 'majdata' 
                : gameSettings.Online.ApiEndpoints[0].Url === 'https://maj-2.moyingmoe.top/api3/api/'
                ? 'moyingmoe'
                : 'custom'
            }
            onChange={(val) => {
              if (!gameSettings || !val) return;
              const newEndpoints = [...gameSettings.Online.ApiEndpoints];
              if (val === 'majdata') {
                newEndpoints[0] = {
                  ...newEndpoints[0],
                  Name: 'Majnet',
                  Url: 'https://majdata.net/api3/api/',
                };
              } else if (val === 'moyingmoe') {
                newEndpoints[0] = {
                  ...newEndpoints[0],
                  Name: 'Majnet',
                  Url: 'https://maj-2.moyingmoe.top/api3/api/',
                };
              } else if (val === 'custom') {
                // 切换到自定义模式，保持当前值或设置默认值
                newEndpoints[0] = {
                  ...newEndpoints[0],
                  Name: newEndpoints[0].Name === 'Majnet' ? 'Custom' : newEndpoints[0].Name,
                  Url: newEndpoints[0].Url.startsWith('https://majdata.net') || newEndpoints[0].Url.startsWith('https://maj-2.moyingmoe.top') 
                    ? '' 
                    : newEndpoints[0].Url,
                };
              }
              setGameSettings({
                ...gameSettings,
                Online: {
                  ...gameSettings.Online,
                  ApiEndpoints: newEndpoints,
                },
              });
            }}
            data={[
              { value: 'majdata', label: 'Majdata.net (官方)' },
              { value: 'moyingmoe', label: 'Moyingmoe (镜像)' },
              { value: 'custom', label: '自定义' },
            ]}
          />

          {(gameSettings.Online.ApiEndpoints[0].Url !== 'https://majdata.net/api3/api/' && 
            gameSettings.Online.ApiEndpoints[0].Url !== 'https://maj-2.moyingmoe.top/api3/api/') && (
            <Stack gap="sm">
              <TextInput
                label="端点名称"
                description="自定义端点的显示名称"
                placeholder="My Custom Server"
                value={gameSettings.Online.ApiEndpoints[0].Name}
                onChange={(event) => {
                  if (!gameSettings) return;
                  const newEndpoints = [...gameSettings.Online.ApiEndpoints];
                  newEndpoints[0] = {
                    ...newEndpoints[0],
                    Name: event.currentTarget.value,
                  };
                  setGameSettings({
                    ...gameSettings,
                    Online: {
                      ...gameSettings.Online,
                      ApiEndpoints: newEndpoints,
                    },
                  });
                }}
              />
              <TextInput
                label="API URL"
                description="自定义的 API 端点地址"
                placeholder="https://example.com/api/"
                value={gameSettings.Online.ApiEndpoints[0].Url}
                onChange={(event) => {
                  if (!gameSettings) return;
                  const newEndpoints = [...gameSettings.Online.ApiEndpoints];
                  newEndpoints[0] = {
                    ...newEndpoints[0],
                    Url: event.currentTarget.value,
                  };
                  setGameSettings({
                    ...gameSettings,
                    Online: {
                      ...gameSettings.Online,
                      ApiEndpoints: newEndpoints,
                    },
                  });
                }}
              />
            </Stack>
          )}

          <Text size="sm" fw={500} mt="xs">账户信息</Text>
          
          <TextInput
            label="用户名"
            description="Majnet 账户用户名"
            placeholder="YourUsername"
            value={gameSettings.Online.ApiEndpoints[0].Username}
            onChange={(event) => {
              if (!gameSettings) return;
              const newEndpoints = [...gameSettings.Online.ApiEndpoints];
              newEndpoints[0] = {
                ...newEndpoints[0],
                Username: event.currentTarget.value,
              };
              setGameSettings({
                ...gameSettings,
                Online: {
                  ...gameSettings.Online,
                  ApiEndpoints: newEndpoints,
                },
              });
            }}
          />

          <PasswordInput
            label="密码"
            description="Majnet 账户密码"
            placeholder="YourPassword"
            value={gameSettings.Online.ApiEndpoints[0].Password}
            onChange={(event) => {
              if (!gameSettings) return;
              const newEndpoints = [...gameSettings.Online.ApiEndpoints];
              newEndpoints[0] = {
                ...newEndpoints[0],
                Password: event.currentTarget.value,
              };
              setGameSettings({
                ...gameSettings,
                Online: {
                  ...gameSettings.Online,
                  ApiEndpoints: newEndpoints,
                },
              });
            }}
          />
        </Stack>
      )}
    </Stack>
  );
}
