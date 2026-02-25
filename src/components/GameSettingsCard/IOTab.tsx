import { Stack, Text, NumberInput, Switch, Slider } from '@mantine/core';
import { GameSettings } from '../../types';

interface IOTabProps {
  gameSettings: GameSettings;
  setGameSettings: (settings: GameSettings) => void;
}

export function IOTab({ gameSettings, setGameSettings }: IOTabProps) {
  return (
    <Stack gap="md">
      <Text size="lg" fw={500}>输入设备</Text>
      
      <NumberInput
        label="玩家编号"
        description="1P 或 2P"
        value={gameSettings.IO.InputDevice.Player}
        onChange={(val) => {
          if (!gameSettings) return;
          setGameSettings({
            ...gameSettings,
            IO: {
              ...gameSettings.IO,
              InputDevice: {
                ...gameSettings.IO.InputDevice,
                Player: val as number,
              },
            },
          });
        }}
        min={1}
        max={2}
        step={1}
      />

      <Text size="md" fw={500} mt="md">输出设备 (LED)</Text>
      
      <Switch
        label="启用 LED"
        checked={gameSettings.IO.OutputDevice.Led.Enable}
        onChange={(event) => {
          if (!gameSettings) return;
          setGameSettings({
            ...gameSettings,
            IO: {
              ...gameSettings.IO,
              OutputDevice: {
                ...gameSettings.IO.OutputDevice,
                Led: {
                  ...gameSettings.IO.OutputDevice.Led,
                  Enable: event.currentTarget.checked,
                },
              },
            },
          });
        }}
      />

      <div>
        <Text size="sm" fw={500} mb="xs">LED 亮度</Text>
        <Slider
          value={gameSettings.IO.OutputDevice.Led.Brightness}
          onChange={(val) => {
            if (!gameSettings) return;
            setGameSettings({
              ...gameSettings,
              IO: {
                ...gameSettings.IO,
                OutputDevice: {
                  ...gameSettings.IO.OutputDevice,
                  Led: {
                    ...gameSettings.IO.OutputDevice.Led,
                    Brightness: val,
                  },
                },
              },
            });
          }}
          min={0}
          max={1}
          step={0.05}
          marks={[
            { value: 0, label: '0%' },
            { value: 0.5, label: '50%' },
            { value: 1, label: '100%' },
          ]}
        />
      </div>

      <NumberInput
        label="LED 刷新率 (毫秒)"
        value={gameSettings.IO.OutputDevice.Led.RefreshRateMs}
        onChange={(val) => {
          if (!gameSettings) return;
          setGameSettings({
            ...gameSettings,
            IO: {
              ...gameSettings.IO,
              OutputDevice: {
                ...gameSettings.IO.OutputDevice,
                Led: {
                  ...gameSettings.IO.OutputDevice.Led,
                  RefreshRateMs: val as number,
                },
              },
            },
          });
        }}
        min={1}
        max={1000}
        step={1}
      />

      <Text size="sm" c="dimmed" mt="md">
        注意：更高级的 IO 设备配置（如按钮环、触摸面板等）较为复杂，建议直接编辑 settings.json 文件。
      </Text>
    </Stack>
  );
}
