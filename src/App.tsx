import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Layout } from './components';
import { HomePage, ChartPage, SkinPage, SettingPage, GamePage } from './pages';

function App() {
  return (
    <MantineProvider>
      <Notifications position="top-right" />
      <HashRouter>
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
    </MantineProvider>
  );
}

export default App;
