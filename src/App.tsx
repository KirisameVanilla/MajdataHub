import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Layout } from './components';
import { HomePage, ChartPage, SkinPage, SettingPage, GamePage } from './pages';
import { usePathContext } from './contexts';

function AppRouter() {
  const { reloadKey } = usePathContext();

  return (
    <HashRouter key={reloadKey}>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/chart" element={<ChartPage />} />
          <Route path="/skin" element={<SkinPage />} />
          <Route path="/setting" element={<SettingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

function App() {
  return (
    <MantineProvider>
      <Notifications position="top-right" />
      <AppRouter />
    </MantineProvider>
  );
}

export default App;
