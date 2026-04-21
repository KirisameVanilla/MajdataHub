import { useState, useEffect } from 'react';
import { Container, Card, Group, Text, Button, Badge, Stack, Select, Modal, ActionIcon, Grid, Accordion, LoadingOverlay, Image, TextInput, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconFolderSymlink, IconPlus, IconFolderPlus, IconUpload, IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import { api } from '../api/client';
import { fileSrc } from '../api/files';
import { usePathContext } from '../contexts';

interface ChartInfo {
  name: string;
  category: string;
  has_bg: boolean;
  has_track: boolean;
  has_maidata: boolean;
  has_video: boolean;
}

interface ImportResult {
  file_name: string;
  status: string;
  chart_name: string | null;
  reason: string | null;
}

// 单独的图片组件，用于处理 jpg/png 回退
function ChartImage({ path, hasBg, alt }: { path: string; hasBg: boolean; alt: string }) {
  const [imgSrc, setImgSrc] = useState(fileSrc(`${path}\\bg.jpg`));
  const [imgError, setImgError] = useState(false);

  const handleError = () => {
    if (imgSrc.includes('bg.jpg')) {
      setImgSrc(fileSrc(`${path}\\bg.png`));
    } else {
      setImgError(true);
    }
  };

  return (
    <Image
      src={hasBg && !imgError ? imgSrc : undefined}
      height={100}
      alt={alt}
      onError={handleError}
      fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"
    />
  );
}

interface LocalChartsProps {
  onRefresh?: () => void;
  refreshTrigger?: number;
}

export function LocalCharts({ onRefresh, refreshTrigger }: LocalChartsProps) {
  const { defaultGameFolderPath } = usePathContext();
  const [categories, setCategories] = useState<string[]>([]);
  const [chartsByCategory, setChartsByCategory] = useState<Record<string, ChartInfo[]>>({});
  const [loading, setLoading] = useState(true);

  // 移动谱面
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [chartToMove, setChartToMove] = useState<ChartInfo | null>(null);
  const [targetCategory, setTargetCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  // 创建分类
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);
  const [createCategoryName, setCreateCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  // 导入谱面
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [importCategory, setImportCategory] = useState<string | null>(null);
  const [importNewCategory, setImportNewCategory] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);

  useEffect(() => {
    loadCharts();
  }, [defaultGameFolderPath]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadCharts();
    }
  }, [refreshTrigger]);

  const loadCharts = async () => {
    if (!defaultGameFolderPath) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const maichartsPath = `${defaultGameFolderPath}\\MaiCharts`;

      // 加载所有分类
      const cats = await api.get<string[]>(`/api/charts/categories?maichartsDir=${encodeURIComponent(maichartsPath)}`);
      setCategories(cats);

      // 加载每个分类的谱面
      const chartData: Record<string, ChartInfo[]> = {};
      for (const category of cats) {
        const charts = await api.get<ChartInfo[]>(`/api/charts/list?maichartsDir=${encodeURIComponent(maichartsPath)}&category=${encodeURIComponent(category)}`);
        chartData[category] = charts;
      }
      setChartsByCategory(chartData);
    } catch (error) {
      console.error('加载谱面失败:', error);
      notifications.show({
        title: '错误',
        message: '加载谱面失败: ' + String(error),
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // ===== 创建分类 =====
  const openCreateCategoryModal = () => {
    setCreateCategoryName('');
    setCreateCategoryModalOpen(true);
  };

  const handleCreateCategory = async () => {
    if (!defaultGameFolderPath || !createCategoryName.trim()) return;

    if (categories.includes(createCategoryName.trim())) {
      notifications.show({
        title: '错误',
        message: '该分类已存在',
        color: 'red',
      });
      return;
    }

    try {
      setCreatingCategory(true);
      const maichartsPath = `${defaultGameFolderPath}\\MaiCharts`;
      await api.post('/api/charts/category', {
        maichartsDir: maichartsPath,
        category: createCategoryName.trim(),
      });

      setCategories(prev => {
        const updated = [...prev, createCategoryName.trim()].sort();
        setChartsByCategory(prev2 => ({ ...prev2, [createCategoryName.trim()]: [] }));
        return updated;
      });

      notifications.show({
        title: '成功',
        message: `分类「${createCategoryName.trim()}」已创建`,
        color: 'green',
      });

      setCreateCategoryModalOpen(false);
    } catch (error) {
      console.error('创建分类失败:', error);
      notifications.show({
        title: '错误',
        message: '创建分类失败: ' + String(error),
        color: 'red',
      });
    } finally {
      setCreatingCategory(false);
    }
  };

  // ===== 导入谱面 =====
  const openImportModal = async () => {
    if (!defaultGameFolderPath) return;

    try {
      const filePaths = await api.post<string[]>('/api/fs/pick-files');
      if (filePaths.length === 0) return;

      setSelectedFiles(filePaths);
      setImportCategory(null);
      setImportNewCategory('');
      setImportResults(null);
      setImportModalOpen(true);
    } catch {
      // 用户取消选择，忽略
    }
  };

  const handleImport = async () => {
    if (!defaultGameFolderPath) return;

    const finalCategory = importCategory || importNewCategory.trim();
    if (!finalCategory) {
      notifications.show({
        title: '错误',
        message: '请选择或输入分类名称',
        color: 'red',
      });
      return;
    }

    try {
      setImporting(true);
      const maichartsPath = `${defaultGameFolderPath}\\MaiCharts`;

      const results = await api.post<ImportResult[]>('/api/charts/import-zips', {
        zipPaths: selectedFiles,
        maichartsDir: maichartsPath,
        category: finalCategory,
      });

      setImportResults(results);

      const imported = results.filter(r => r.status === 'imported').length;
      const skipped = results.filter(r => r.status === 'skipped').length;
      const failed = results.filter(r => r.status === 'failed').length;

      if (imported > 0) {
        notifications.show({
          title: '导入完成',
          message: `成功导入 ${imported} 个谱面${skipped > 0 ? `，跳过 ${skipped} 个` : ''}${failed > 0 ? `，失败 ${failed} 个` : ''}`,
          color: imported === results.length ? 'green' : 'yellow',
        });
      } else {
        notifications.show({
          title: '导入完成',
          message: `没有谱面被导入${skipped > 0 ? `，跳过 ${skipped} 个` : ''}${failed > 0 ? `，失败 ${failed} 个` : ''}`,
          color: 'yellow',
        });
      }

      // 刷新谱面列表
      loadCharts();
    } catch (error) {
      console.error('导入谱面失败:', error);
      notifications.show({
        title: '错误',
        message: '导入谱面失败: ' + String(error),
        color: 'red',
      });
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setImportModalOpen(false);
    if (importResults) {
      // 有导入结果时刷新列表
      loadCharts();
    }
  };

  // ===== 删除谱面 =====
  const handleDeleteChart = async (chart: ChartInfo) => {
    if (!defaultGameFolderPath) return;

    const confirmed = window.confirm(`确定要删除谱面 "${chart.name}" 吗？此操作不可恢复！`);
    if (!confirmed) return;

    try {
      const maichartsPath = `${defaultGameFolderPath}\\MaiCharts`;
      await api.delete('/api/charts/chart', {
        maichartsDir: maichartsPath,
        category: chart.category,
        chartName: chart.name,
      });

      notifications.show({
        title: '成功',
        message: '谱面已删除',
        color: 'green',
      });

      setChartsByCategory(prev => ({
        ...prev,
        [chart.category]: prev[chart.category].filter(c => c.name !== chart.name)
      }));
      onRefresh?.();
    } catch (error) {
      console.error('删除谱面失败:', error);
      notifications.show({
        title: '错误',
        message: '删除谱面失败: ' + String(error),
        color: 'red',
      });
    }
  };

  // ===== 移动谱面 =====
  const handleMoveChart = async () => {
    if (!defaultGameFolderPath || !chartToMove) return;

    const finalCategory = targetCategory || newCategoryName.trim();
    if (!finalCategory) {
      notifications.show({
        title: '错误',
        message: '请选择或输入分类名称',
        color: 'red',
      });
      return;
    }

    try {
      const maichartsPath = `${defaultGameFolderPath}\\MaiCharts`;

      if (newCategoryName && !categories.includes(finalCategory)) {
        await api.post('/api/charts/category', {
          maichartsDir: maichartsPath,
          category: finalCategory,
        });
        setCategories([...categories, finalCategory]);
      }

      await api.post('/api/charts/move', {
        maichartsDir: maichartsPath,
        fromCategory: chartToMove.category,
        toCategory: finalCategory,
        chartName: chartToMove.name,
      });

      notifications.show({
        title: '成功',
        message: '谱面已移动',
        color: 'green',
      });

      setChartsByCategory(prev => {
        const updatedChart = { ...chartToMove!, category: finalCategory };
        return {
          ...prev,
          [chartToMove!.category]: prev[chartToMove!.category].filter(c => c.name !== chartToMove!.name),
          [finalCategory]: [...(prev[finalCategory] || []), updatedChart]
        };
      });

      setMoveModalOpen(false);
      setChartToMove(null);
      setTargetCategory(null);
      setNewCategoryName('');
      onRefresh?.();
    } catch (error) {
      console.error('移动谱面失败:', error);
      notifications.show({
        title: '错误',
        message: '移动谱面失败: ' + String(error),
        color: 'red',
      });
    }
  };

  const openMoveModal = (chart: ChartInfo) => {
    setChartToMove(chart);
    setTargetCategory(null);
    setNewCategoryName('');
    setMoveModalOpen(true);
  };

  if (loading) {
    return (
      <Container size="xl" py="xl" style={{ position: 'relative', minHeight: 400 }}>
        <LoadingOverlay visible={true} />
      </Container>
    );
  }

  const headerButtons = (
    <Group gap="xs">
      <Button
        leftSection={<IconFolderPlus size={16} />}
        onClick={openCreateCategoryModal}
        variant="light"
        size="xs"
      >
        创建分类
      </Button>
      <Button
        leftSection={<IconUpload size={16} />}
        onClick={openImportModal}
        variant="light"
        size="xs"
      >
        导入谱面
      </Button>
      <Button onClick={loadCharts} variant="light" size="xs">
        刷新
      </Button>
    </Group>
  );

  if (categories.length === 0) {
    return (
      <>
        <Container size="xl" py="xl">
          <Stack align="center" gap="md">
            <Text c="dimmed">暂无谱面分类</Text>
            <Group gap="xs">
              <Button
                leftSection={<IconFolderPlus size={16} />}
                onClick={openCreateCategoryModal}
                variant="light"
                size="sm"
              >
                创建分类
              </Button>
              <Button
                leftSection={<IconUpload size={16} />}
                onClick={openImportModal}
                variant="light"
                size="sm"
              >
                导入谱面
              </Button>
            </Group>
          </Stack>
        </Container>

        <CreateCategoryModal />
      </>
    );
  }

  return (
    <>
      <Container size="xl" py="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="lg" fw={600}>本地谱面</Text>
            {headerButtons}
          </Group>

          <Accordion multiple>
            {categories.map(category => (
              <Accordion.Item key={category} value={category}>
                <Accordion.Control>
                  <Group>
                    <Text fw={500}>{category}</Text>
                    <Badge>{chartsByCategory[category]?.length || 0} 个谱面</Badge>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Grid gutter="sm">
                    {chartsByCategory[category]?.map(chart => {
                      const chartPath = `${defaultGameFolderPath}\\MaiCharts\\${category}\\${chart.name}`;

                      return (
                        <Grid.Col key={chart.name} span={{ base: 12, sm: 6, md: 3, lg: 2.4 }}>
                          <Card shadow="sm" padding="sm" radius="md" withBorder>
                            <Card.Section>
                              <ChartImage path={chartPath} hasBg={chart.has_bg} alt={chart.name} />
                            </Card.Section>

                            <Stack gap="xs" mt="sm">
                              <Text fw={500} size="xs" lineClamp={1}>
                                {chart.name}
                              </Text>

                              <Group gap={4}>
                                <ActionIcon
                                  size="sm"
                                  color="blue"
                                  variant="light"
                                  onClick={() => openMoveModal(chart)}
                                  title="移动到其他分类"
                                  style={{ flex: 1 }}
                                >
                                  <IconFolderSymlink size={16} />
                                </ActionIcon>
                                <ActionIcon
                                  size="sm"
                                  color="red"
                                  variant="light"
                                  onClick={() => handleDeleteChart(chart)}
                                  title="删除谱面"
                                  style={{ flex: 1 }}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Group>
                            </Stack>
                          </Card>
                        </Grid.Col>
                      );
                    })}
                  </Grid>
                  {chartsByCategory[category]?.length === 0 && (
                    <Text c="dimmed" ta="center" py="xl">
                      该分类下暂无谱面
                    </Text>
                  )}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Stack>
      </Container>

      <CreateCategoryModal />
      <MoveModal />
      <ImportModal />
    </>
  );

  function CreateCategoryModal() {
    return (
      <Modal
        opened={createCategoryModalOpen}
        onClose={() => setCreateCategoryModalOpen(false)}
        title="创建分类"
      >
        <Stack gap="md">
          <TextInput
            label="分类名称"
            placeholder="输入新分类名称"
            value={createCategoryName}
            onChange={(e) => setCreateCategoryName(e.currentTarget.value)}
            leftSection={<IconPlus size={16} />}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateCategory();
            }}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setCreateCategoryModalOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={!createCategoryName.trim()}
              loading={creatingCategory}
            >
              创建
            </Button>
          </Group>
        </Stack>
      </Modal>
    );
  }

  function MoveModal() {
    return (
      <Modal
        opened={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        title="移动谱面"
      >
        <Stack gap="md">
          <Text size="sm">
            将谱面 <Text span fw={600}>{chartToMove?.name}</Text> 从 <Text span c="blue">{chartToMove?.category}</Text> 移动到：
          </Text>

          <Select
            label="选择已有分类"
            placeholder="选择分类"
            data={categories.filter(c => c !== chartToMove?.category)}
            value={targetCategory}
            onChange={(value) => {
              setTargetCategory(value);
              setNewCategoryName('');
            }}
            searchable
            clearable
          />

          <Divider label="或" labelPosition="center" />

          <TextInput
            label="创建新分类"
            placeholder="输入新分类名称"
            value={newCategoryName}
            onChange={(e) => {
              setNewCategoryName(e.target.value);
              setTargetCategory(null);
            }}
            leftSection={<IconPlus size={16} />}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setMoveModalOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleMoveChart}
              disabled={!targetCategory && !newCategoryName.trim()}
            >
              移动
            </Button>
          </Group>
        </Stack>
      </Modal>
    );
  }

  function ImportModal() {
    const finalCategory = importCategory || importNewCategory.trim();

    return (
      <Modal
        opened={importModalOpen}
        onClose={closeImportModal}
        title="导入谱面"
        size="lg"
      >
        <Stack gap="md">
          {!importResults ? (
            <>
              {/* 选中的文件列表 */}
              <div>
                <Text size="sm" fw={500} mb="xs">
                  已选择 {selectedFiles.length} 个文件：
                </Text>
                <Stack gap={4} style={{ maxHeight: 160, overflowY: 'auto' }}>
                  {selectedFiles.map((filePath, index) => (
                    <Text key={index} size="xs" c="dimmed" truncate>
                      {filePath.split('\\').pop() || filePath.split('/').pop()}
                    </Text>
                  ))}
                </Stack>
              </div>

              {/* 分类选择 */}
              <Select
                label="导入到分类"
                placeholder="选择已有分类"
                data={categories}
                value={importCategory}
                onChange={(value) => {
                  setImportCategory(value);
                  setImportNewCategory('');
                }}
                searchable
                clearable
                disabled={!!importNewCategory.trim()}
              />

              <Divider label="或创建新分类" labelPosition="center" />

              <TextInput
                placeholder="输入新分类名称"
                value={importNewCategory}
                onChange={(e) => {
                  setImportNewCategory(e.target.value);
                  setImportCategory(null);
                }}
                leftSection={<IconPlus size={16} />}
                disabled={!!importCategory}
              />

              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={closeImportModal}>
                  取消
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!finalCategory}
                  loading={importing}
                  leftSection={<IconUpload size={16} />}
                >
                  导入 ({selectedFiles.length} 个文件)
                </Button>
              </Group>
            </>
          ) : (
            <>
              {/* 导入结果 */}
              <Text size="sm" fw={500}>导入结果：</Text>
              <Stack gap={4} style={{ maxHeight: 300, overflowY: 'auto' }}>
                {importResults.map((result, index) => (
                  <Group key={index} gap="xs" wrap="nowrap">
                    {result.status === 'imported' ? (
                      <IconCheck size={16} color="var(--mantine-color-green-6)" />
                    ) : result.status === 'skipped' ? (
                      <IconAlertCircle size={16} color="var(--mantine-color-yellow-6)" />
                    ) : (
                      <IconX size={16} color="var(--mantine-color-red-6)" />
                    )}
                    <Text size="xs" fw={500}>
                      {result.file_name}
                    </Text>
                    {result.chart_name && (
                      <Text size="xs" c="dimmed">
                        → {result.chart_name}
                      </Text>
                    )}
                    {result.reason && (
                      <Text size="xs" c="dimmed">
                        ({result.reason})
                      </Text>
                    )}
                  </Group>
                ))}
              </Stack>

              <Group justify="flex-end" mt="md">
                <Button onClick={closeImportModal}>完成</Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>
    );
  }
}
