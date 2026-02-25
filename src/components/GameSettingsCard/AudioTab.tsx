import { Stack, Switch, Accordion, Text, Slider } from '@mantine/core';
import { GameSettings } from '../../types';

interface AudioTabProps {
  gameSettings: GameSettings;
  updateVolumeSettings: (key: keyof GameSettings['Audio']['Volume'], value: number) => void;
  updateGameSettings: <K extends keyof GameSettings>(
    section: K,
    key: keyof GameSettings[K],
    value: any
  ) => void;
}

export function AudioTab({ gameSettings, updateVolumeSettings, updateGameSettings }: AudioTabProps) {
  return (
    <Stack gap="md">
      <div>
        <Text size="sm" fw={500} mb="xs">全局音量</Text>
        <Slider
          value={gameSettings.Audio.Volume.Global}
          onChange={(val) => updateVolumeSettings('Global', val)}
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

      <Accordion variant="separated">
        <Accordion.Item value="volumes">
          <Accordion.Control>详细音量设置</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <div>
                <Text size="sm" fw={500} mb="xs">BGM 音量</Text>
                <Slider
                  value={gameSettings.Audio.Volume.BGM}
                  onChange={(val) => updateVolumeSettings('BGM', val)}
                  min={0}
                  max={2}
                  step={0.05}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 1, label: '1.0' },
                    { value: 2, label: '2.0' },
                  ]}
                />
              </div>

              <div>
                <Text size="sm" fw={500} mb="xs">应答音音量</Text>
                <Slider
                  value={gameSettings.Audio.Volume.Answer}
                  onChange={(val) => updateVolumeSettings('Answer', val)}
                  min={0}
                  max={2}
                  step={0.05}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 1, label: '1.0' },
                    { value: 2, label: '2.0' },
                  ]}
                />
              </div>

              <div>
                <Text size="sm" fw={500} mb="xs">Tap 音效</Text>
                <Slider
                  value={gameSettings.Audio.Volume.Tap}
                  onChange={(val) => updateVolumeSettings('Tap', val)}
                  min={0}
                  max={2}
                  step={0.05}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 1, label: '1.0' },
                    { value: 2, label: '2.0' },
                  ]}
                />
              </div>

              <div>
                <Text size="sm" fw={500} mb="xs">Slide 音效</Text>
                <Slider
                  value={gameSettings.Audio.Volume.Slide}
                  onChange={(val) => updateVolumeSettings('Slide', val)}
                  min={0}
                  max={2}
                  step={0.05}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 1, label: '1.0' },
                    { value: 2, label: '2.0' },
                  ]}
                />
              </div>

              <div>
                <Text size="sm" fw={500} mb="xs">Touch 音效</Text>
                <Slider
                  value={gameSettings.Audio.Volume.Touch}
                  onChange={(val) => updateVolumeSettings('Touch', val)}
                  min={0}
                  max={2}
                  step={0.05}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 1, label: '1.0' },
                    { value: 2, label: '2.0' },
                  ]}
                />
              </div>

              <div>
                <Text size="sm" fw={500} mb="xs">Break 音效</Text>
                <Slider
                  value={gameSettings.Audio.Volume.Break}
                  onChange={(val) => updateVolumeSettings('Break', val)}
                  min={0}
                  max={2}
                  step={0.05}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 1, label: '1.0' },
                    { value: 2, label: '2.0' },
                  ]}
                />
              </div>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Switch
        label="强制单声道输出"
        checked={gameSettings.Audio.ForceMono}
        onChange={(event) => updateGameSettings('Audio', 'ForceMono', event.currentTarget.checked)}
      />
    </Stack>
  );
}
