import { Stack, NumberInput, Select } from '@mantine/core';
import { GameSettings } from '../../types';

interface JudgeTabProps {
  gameSettings: GameSettings;
  updateGameSettings: <K extends keyof GameSettings>(
    section: K,
    key: keyof GameSettings[K],
    value: any
  ) => void;
}

export function JudgeTab({ gameSettings, updateGameSettings }: JudgeTabProps) {
  return (
    <Stack gap="md">
      <NumberInput
        label="音频偏移 (Audio Offset)"
        description={`用于修正音频延迟，单位：${gameSettings.Debug.OffsetUnit === 'Second' ? '秒' : '帧'}`}
        value={gameSettings.Judge.AudioOffset}
        onChange={(val) => updateGameSettings('Judge', 'AudioOffset', val)}
        step={gameSettings.Debug.OffsetUnit === 'Second' ? 0.001 : 0.1}
        decimalScale={gameSettings.Debug.OffsetUnit === 'Second' ? 3 : 1}
      />

      <NumberInput
        label="判定偏移 (Judge Offset)"
        description={`用于调整判定时机，单位：${gameSettings.Debug.OffsetUnit === 'Second' ? '秒' : '帧'}`}
        value={gameSettings.Judge.JudgeOffset}
        onChange={(val) => updateGameSettings('Judge', 'JudgeOffset', val)}
        step={gameSettings.Debug.OffsetUnit === 'Second' ? 0.001 : 0.1}
        decimalScale={gameSettings.Debug.OffsetUnit === 'Second' ? 3 : 1}
      />

      <NumberInput
        label="应答音偏移 (Answer Offset)"
        description={`应答音偏移量，单位：${gameSettings.Debug.OffsetUnit === 'Second' ? '秒' : '帧'}`}
        value={gameSettings.Judge.AnswerOffset}
        onChange={(val) => updateGameSettings('Judge', 'AnswerOffset', val)}
        step={gameSettings.Debug.OffsetUnit === 'Second' ? 0.001 : 0.1}
        decimalScale={gameSettings.Debug.OffsetUnit === 'Second' ? 3 : 1}
      />

      <NumberInput
        label="触摸面板偏移"
        description={`触摸面板的偏移量，单位：${gameSettings.Debug.OffsetUnit === 'Second' ? '秒' : '帧'}`}
        value={gameSettings.Judge.TouchPanelOffset}
        onChange={(val) => updateGameSettings('Judge', 'TouchPanelOffset', val)}
        step={gameSettings.Debug.OffsetUnit === 'Second' ? 0.001 : 0.1}
        decimalScale={gameSettings.Debug.OffsetUnit === 'Second' ? 3 : 1}
      />

      <Select
        label="判定模式"
        value={gameSettings.Judge.Mode}
        onChange={(val) => updateGameSettings('Judge', 'Mode', val)}
        data={[
          { value: 'Classic', label: '经典' },
          { value: 'Modern', label: '现代' },
        ]}
      />
    </Stack>
  );
}
