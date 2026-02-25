import { useState, useEffect } from 'react';
import { Card, LoadingOverlay, Group, Title, Button, Tabs, Stack, NumberInput, Slider, Select, Switch, Text, Accordion, TextInput, PasswordInput, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSettings, IconDeviceGamepad, IconVolume, IconEye, IconAdjustments, IconCheck, IconAlertCircle, IconBug, IconWorld, IconPlug } from '@tabler/icons-react';
import { GameSettings } from '../types';
import { invoke } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';

interface GameSettingsCardProps {
  gameFolderPath: string;
  hasGameExe: boolean;
}

export function GameSettingsCard({ gameFolderPath, hasGameExe }: GameSettingsCardProps) {
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // 加载游戏设置
  useEffect(() => {
    const loadGameSettings = async () => {
      if (!gameFolderPath || !hasGameExe) {
        setGameSettings(null);
        return;
      }

      try {
        setIsLoadingSettings(true);
        const settingsPath = await join(gameFolderPath, 'settings.json');
        const fileExists = await invoke<boolean>('file_exists', { path: settingsPath });
        
        if (fileExists) {
          const content = await invoke<string>('read_file_content', { path: settingsPath });
          const settings = JSON.parse(content) as GameSettings;
          setGameSettings(settings);
        } else {
          setGameSettings(null);
        }
      } catch (error) {
        console.error('加载游戏设置失败:', error);
        notifications.show({
          title: '错误',
          message: '加载游戏设置失败: ' + (error as Error).message,
          color: 'red',
          icon: <IconAlertCircle />,
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadGameSettings();
  }, [gameFolderPath, hasGameExe]);

  // 保存游戏设置
  const saveGameSettings = async () => {
    if (!gameFolderPath || !gameSettings) return;

    try {
      setIsSavingSettings(true);
      const settingsPath = await join(gameFolderPath, 'settings.json');
      const content = JSON.stringify(gameSettings, null, 2);
      
      await invoke('write_file_content', {
        path: settingsPath,
        content: content,
      });

      notifications.show({
        title: '保存成功',
        message: '游戏设置已保存',
        color: 'green',
        icon: <IconCheck />,
      });
    } catch (error) {
      console.error('保存游戏设置失败:', error);
      notifications.show({
        title: '保存失败',
        message: '保存游戏设置失败: ' + (error as Error).message,
        color: 'red',
        icon: <IconAlertCircle />,
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 更新设置的辅助函数
  const updateGameSettings = <K extends keyof GameSettings>(
    section: K,
    key: keyof GameSettings[K],
    value: any
  ) => {
    if (!gameSettings) return;
    
    setGameSettings({
      ...gameSettings,
      [section]: {
        ...gameSettings[section],
        [key]: value,
      },
    });
  };

  // 更新音量设置的辅助函数
  const updateVolumeSettings = (key: keyof GameSettings['Audio']['Volume'], value: number) => {
    if (!gameSettings) return;
    
    setGameSettings({
      ...gameSettings,
      Audio: {
        ...gameSettings.Audio,
        Volume: {
          ...gameSettings.Audio.Volume,
          [key]: value,
        },
      },
    });
  };

  if (!hasGameExe || !gameSettings) {
    return <Alert mt="lg" color="red" variant="light" icon={<IconAlertCircle />}>
          游戏设置不可用！请先运行一次游戏。
        </Alert>;
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder mt="sm" className="relative">
      <LoadingOverlay visible={isLoadingSettings || isSavingSettings} />
      
      <Group justify="space-between" mb="lg">
        <Title order={3}>
          <Group gap="sm">
            <IconSettings size={24} />
            <span>游戏设置</span>
          </Group>
        </Title>
        <Button
          onClick={saveGameSettings}
          loading={isSavingSettings}
          leftSection={<IconCheck size={16} />}
        >
          保存设置
        </Button>
      </Group>

      <Tabs defaultValue="game">
        <Tabs.List>
          <Tabs.Tab value="game" leftSection={<IconDeviceGamepad size={16} />}>
            游戏
          </Tabs.Tab>
          <Tabs.Tab value="judge" leftSection={<IconAdjustments size={16} />}>
            判定
          </Tabs.Tab>
          <Tabs.Tab value="display" leftSection={<IconEye size={16} />}>
            显示
          </Tabs.Tab>
          <Tabs.Tab value="audio" leftSection={<IconVolume size={16} />}>
            音频
          </Tabs.Tab>
          <Tabs.Tab value="debug" leftSection={<IconBug size={16} />}>
            调试
          </Tabs.Tab>
          <Tabs.Tab value="online" leftSection={<IconWorld size={16} />}>
            在线
          </Tabs.Tab>
          <Tabs.Tab value="io" leftSection={<IconPlug size={16} />}>
            IO设备
          </Tabs.Tab>
        </Tabs.List>

        {/* 游戏设置 */}
        <Tabs.Panel value="game" pt="md">
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
        </Tabs.Panel>

        {/* 判定设置 */}
        <Tabs.Panel value="judge" pt="md">
          <Stack gap="md">
            <NumberInput
              label="音频偏移 (Audio Offset)"
              description="用于修正音频延迟，单位：秒"
              value={gameSettings.Judge.AudioOffset}
              onChange={(val) => updateGameSettings('Judge', 'AudioOffset', val)}
              step={0.001}
              decimalScale={3}
            />

            <NumberInput
              label="判定偏移 (Judge Offset)"
              description="用于调整判定时机，单位：秒"
              value={gameSettings.Judge.JudgeOffset}
              onChange={(val) => updateGameSettings('Judge', 'JudgeOffset', val)}
              step={0.001}
              decimalScale={3}
            />

            <NumberInput
              label="应答音偏移 (Answer Offset)"
              description="应答音偏移量，单位：秒"
              value={gameSettings.Judge.AnswerOffset}
              onChange={(val) => updateGameSettings('Judge', 'AnswerOffset', val)}
              step={0.001}
              decimalScale={3}
            />

            <NumberInput
              label="触摸面板偏移"
              description="触摸面板的偏移量，单位：秒"
              value={gameSettings.Judge.TouchPanelOffset}
              onChange={(val) => updateGameSettings('Judge', 'TouchPanelOffset', val)}
              step={0.001}
              decimalScale={3}
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
        </Tabs.Panel>

        {/* 显示设置 */}
        <Tabs.Panel value="display" pt="md">
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
        </Tabs.Panel>

        {/* 音频设置 */}
        <Tabs.Panel value="audio" pt="md">
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
        </Tabs.Panel>

        {/* 调试设置 */}
        <Tabs.Panel value="debug" pt="md">
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
              description="显示偏移量"
              value={gameSettings.Debug.DisplayOffset}
              onChange={(val) => updateGameSettings('Debug', 'DisplayOffset', val)}
              step={0.001}
              decimalScale={3}
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
              onChange={(val) => updateGameSettings('Debug', 'OffsetUnit', val)}
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
        </Tabs.Panel>

        {/* 在线设置 */}
        <Tabs.Panel value="online" pt="md">
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
        </Tabs.Panel>

        {/* IO设备设置 */}
        <Tabs.Panel value="io" pt="md">
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
        </Tabs.Panel>
      </Tabs>
    </Card>
  );
}
