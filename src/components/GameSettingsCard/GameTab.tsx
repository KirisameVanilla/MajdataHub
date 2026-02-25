import { Stack, NumberInput, Select, Switch, Text, Slider } from '@mantine/core';
import { GameSettings } from '../../types';

interface GameTabProps {
  gameSettings: GameSettings;
  updateGameSettings: <K extends keyof GameSettings>(
    section: K,
    key: keyof GameSettings[K],
    value: any
  ) => void;
}

export function GameTab({ gameSettings, updateGameSettings }: GameTabProps) {
  return (
    <Stack gap="md">
      <NumberInput
        label="Tap 速度"
        description="控制 TAP、HOLD、STAR 等 note 的下落速度"
        value={gameSettings.Game.TapSpeed}
        onChange={(val) => updateGameSettings('Game', 'TapSpeed', val)}
        min={-12}
        max={12}
        step={0.25}
        decimalScale={2}
      />
      
      <NumberInput
        label="Touch 速度"
        description="控制 TOUCH 类 note 的速度"
        value={gameSettings.Game.TouchSpeed}
        onChange={(val) => updateGameSettings('Game', 'TouchSpeed', val)}
        min={0.5}
        max={12}
        step={0.25}
        decimalScale={2}
      />

      <div>
        <Text size="sm" fw={500} mb="xs">背景暗化</Text>
        <Text size="xs" c="dimmed" mb="xs">0为不暗化，1为完全黑色</Text>
        <Slider
          value={gameSettings.Game.BackgroundDim}
          onChange={(val) => updateGameSettings('Game', 'BackgroundDim', val)}
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

      <Select
        label="背景信息显示"
        description="控制游戏中背景信息显示内容"
        value={gameSettings.Game.BGInfo}
        onChange={(val) => updateGameSettings('Game', 'BGInfo', val)}
        data={[
          { value: 'CPCombo', label: '大P连击数' },
          { value: 'PCombo', label: 'P连击数' },
          { value: 'Combo', label: '连击数' },
          { value: 'Achievement_101', label: '达成率(101%)' },
          { value: 'Achievement_100', label: '达成率(100%)' },
          { value: 'DXScore', label: 'DX分数' },
          { value: 'None', label: '不显示' },
        ]}
      />

      <Select
        label="顶部信息显示"
        description="控制顶部信息栏显示内容"
        value={gameSettings.Game.TopInfo}
        onChange={(val) => updateGameSettings('Game', 'TopInfo', val)}
        data={[
          { value: 'None', label: '不显示' },
          { value: 'Judge', label: '判定信息' },
          { value: 'Timing', label: '时机信息' },
          { value: 'TimingGauge', label: '时机量表' },
        ]}
      />

      <Switch
        label="星星旋转动画"
        description="是否启用星星note的旋转动画"
        checked={gameSettings.Game.StarRotation}
        onChange={(event) => updateGameSettings('Game', 'StarRotation', event.currentTarget.checked)}
      />

      <Switch
        label="允许跳过前奏"
        checked={gameSettings.Game.TrackSkip}
        onChange={(event) => updateGameSettings('Game', 'TrackSkip', event.currentTarget.checked)}
      />

      <Switch
        label="快速重试"
        checked={gameSettings.Game.FastRetry}
        onChange={(event) => updateGameSettings('Game', 'FastRetry', event.currentTarget.checked)}
      />
    </Stack>
  );
}
