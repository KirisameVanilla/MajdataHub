import { Stack, Switch, Select, Accordion, Text, Slider, NumberInput } from '@mantine/core';
import { GameSettings } from '../../types';

interface DisplayTabProps {
  gameSettings: GameSettings;
  updateGameSettings: <K extends keyof GameSettings>(
    section: K,
    key: keyof GameSettings[K],
    value: any
  ) => void;
}

export function DisplayTab({ gameSettings, updateGameSettings }: DisplayTabProps) {
  return (
    <Stack gap="md">
      <Switch
        label="显示 Critical Perfect"
        checked={gameSettings.Display.DisplayCriticalPerfect}
        onChange={(event) => updateGameSettings('Display', 'DisplayCriticalPerfect', event.currentTarget.checked)}
      />

      <Switch
        label="显示 Break 分数"
        checked={gameSettings.Display.DisplayBreakScore}
        onChange={(event) => updateGameSettings('Display', 'DisplayBreakScore', event.currentTarget.checked)}
      />

      <Select
        label="Fast/Late 提示"
        value={gameSettings.Display.FastLateType}
        onChange={(val) => updateGameSettings('Display', 'FastLateType', val)}
        data={[
          { value: 'All', label: '显示所有' },
          { value: 'BelowCP', label: 'CP以下' },
          { value: 'BelowP', label: 'P以下' },
          { value: 'BelowGR', label: 'Great以下' },
          { value: 'MissOnly', label: '仅Miss' },
          { value: 'Disable', label: '不显示' },
        ]}
      />

      <Accordion variant="separated">
        <Accordion.Item value="scales">
          <Accordion.Control>Note 缩放设置</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <div>
                <Text size="sm" fw={500} mb="xs">Tap 缩放</Text>
                <Slider
                  value={gameSettings.Display.TapScale}
                  onChange={(val) => updateGameSettings('Display', 'TapScale', val)}
                  min={0}
                  max={2}
                  step={0.01}
                  marks={[
                    { value: 0.5, label: '0.5' },
                    { value: 1, label: '1.0' },
                    { value: 1.5, label: '1.5' },
                    { value: 2, label: '2.0' },
                  ]}
                />
              </div>

              <div>
                <Text size="sm" fw={500} mb="xs">Hold 缩放</Text>
                <Slider
                  value={gameSettings.Display.HoldScale}
                  onChange={(val) => updateGameSettings('Display', 'HoldScale', val)}
                  min={0}
                  max={2}
                  step={0.01}
                  marks={[
                    { value: 0.5, label: '0.5' },
                    { value: 1, label: '1.0' },
                    { value: 1.5, label: '1.5' },
                    { value: 2, label: '2.0' },
                  ]}
                />
              </div>

              <div>
                <Text size="sm" fw={500} mb="xs">Touch 缩放</Text>
                <Slider
                  value={gameSettings.Display.TouchScale}
                  onChange={(val) => updateGameSettings('Display', 'TouchScale', val)}
                  min={0}
                  max={2}
                  step={0.01}
                  marks={[
                    { value: 0.5, label: '0.5' },
                    { value: 1, label: '1.0' },
                    { value: 1.5, label: '1.5' },
                    { value: 2, label: '2.0' },
                  ]}
                />
              </div>

              <div>
                <Text size="sm" fw={500} mb="xs">Slide 缩放</Text>
                <Slider
                  value={gameSettings.Display.SlideScale}
                  onChange={(val) => updateGameSettings('Display', 'SlideScale', val)}
                  min={0}
                  max={2}
                  step={0.01}
                  marks={[
                    { value: 0.5, label: '0.5' },
                    { value: 1, label: '1.0' },
                    { value: 1.5, label: '1.5' },
                    { value: 2, label: '2.0' },
                  ]}
                />
              </div>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="performance">
          <Accordion.Control>性能设置</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <NumberInput
                label="FPS 限制"
                description="-1 表示无限制"
                value={gameSettings.Display.FPSLimit}
                onChange={(val) => updateGameSettings('Display', 'FPSLimit', val)}
                min={-1}
                max={300}
                step={1}
              />

              <Select
                label="渲染质量"
                value={gameSettings.Display.RenderQuality}
                onChange={(val) => updateGameSettings('Display', 'RenderQuality', val)}
                data={[
                  { value: 'VeryLow', label: '极低' },
                  { value: 'Low', label: '低' },
                  { value: 'Medium', label: '中' },
                  { value: 'High', label: '高' },
                  { value: 'VeryHight', label: '极高' },
                  { value: 'Ultra', label: '超高' },
                ]}
              />

              <Switch
                label="垂直同步 (VSync)"
                checked={gameSettings.Display.VSync}
                onChange={(event) => updateGameSettings('Display', 'VSync', event.currentTarget.checked)}
              />
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}
