import { Stack, Switch, NumberInput, Select, Accordion } from '@mantine/core';
import { GameSettings } from '../../types';

interface DebugTabProps {
  gameSettings: GameSettings;
  setGameSettings: (settings: GameSettings) => void;
  updateGameSettings: <K extends keyof GameSettings>(
    section: K,
    key: keyof GameSettings[K],
    value: any
  ) => void;
}

export function DebugTab({ gameSettings, setGameSettings, updateGameSettings }: DebugTabProps) {
  return (
    <Stack gap="md">
      <Switch
        label="显示传感器信息"
        checked={gameSettings.Debug.DisplaySensor}
        onChange={(event) => updateGameSettings('Debug', 'DisplaySensor', event.currentTarget.checked)}
      />

      <Switch
        label="显示 FPS"
        checked={gameSettings.Debug.DisplayFPS}
        onChange={(event) => updateGameSettings('Debug', 'DisplayFPS', event.currentTarget.checked)}
      />

      <NumberInput
        label="显示偏移"
        description={`显示偏移量，单位：${gameSettings.Debug.OffsetUnit === 'Second' ? '秒' : '帧'}`}
        value={gameSettings.Debug.DisplayOffset}
        onChange={(val) => updateGameSettings('Debug', 'DisplayOffset', val)}
        step={gameSettings.Debug.OffsetUnit === 'Second' ? 0.001 : 0.1}
        decimalScale={gameSettings.Debug.OffsetUnit === 'Second' ? 3 : 1}
      />

      <NumberInput
        label="Note 出现速率"
        value={gameSettings.Debug.NoteAppearRate}
        onChange={(val) => updateGameSettings('Debug', 'NoteAppearRate', val)}
        step={0.001}
        decimalScale={3}
      />

      <Select
        label="偏移量单位"
        value={gameSettings.Debug.OffsetUnit}
        onChange={(val) => {
          if (!gameSettings || !val) return;
          
          // 根据新单位调整精度
          const precision = val === 'Second' ? 1000 : 10; // 秒: 3位小数, 帧: 1位小数
          const roundValue = (value: number) => Math.round(value * precision) / precision;
          
          setGameSettings({
            ...gameSettings,
            Judge: {
              ...gameSettings.Judge,
              AudioOffset: roundValue(gameSettings.Judge.AudioOffset),
              JudgeOffset: roundValue(gameSettings.Judge.JudgeOffset),
              AnswerOffset: roundValue(gameSettings.Judge.AnswerOffset),
              TouchPanelOffset: roundValue(gameSettings.Judge.TouchPanelOffset),
            },
            Debug: {
              ...gameSettings.Debug,
              OffsetUnit: val,
              DisplayOffset: roundValue(gameSettings.Debug.DisplayOffset),
            },
          });
        }}
        data={[
          { value: 'Second', label: '秒' },
          { value: 'Frame', label: '帧' },
        ]}
      />

      <Select
        label="DJ自动模式策略"
        value={gameSettings.Debug.DJAutoPolicy}
        onChange={(val) => updateGameSettings('Debug', 'DJAutoPolicy', val)}
        data={[
          { value: 'Strict', label: '严格模式' },
          { value: 'Permissive', label: '宽松模式' },
        ]}
      />

      <Accordion variant="separated">
        <Accordion.Item value="advanced">
          <Accordion.Control>高级调试选项</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <NumberInput
                label="菜单选项迭代速度"
                value={gameSettings.Debug.MenuOptionIterationSpeed}
                onChange={(val) => updateGameSettings('Debug', 'MenuOptionIterationSpeed', val)}
                min={1}
                max={200}
                step={1}
              />

              <NumberInput
                label="最大队列帧数"
                value={gameSettings.Debug.MaxQueuedFrames}
                onChange={(val) => updateGameSettings('Debug', 'MaxQueuedFrames', val)}
                min={0}
                max={10}
                step={1}
              />

              <Switch
                label="Note 折叠"
                checked={gameSettings.Debug.NoteFolding}
                onChange={(event) => updateGameSettings('Debug', 'NoteFolding', event.currentTarget.checked)}
              />
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}
