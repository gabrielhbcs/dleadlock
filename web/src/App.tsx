import { Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { GAMES } from './games/registry';
import { Hub } from './pages/Hub';

// HashRouter keeps routing working on GitHub Pages without a server rewrite.
export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Hub />} />
            {GAMES.filter((g) => g.status === 'live' && g.component).map((g) => {
              const Game = g.component!;
              return <Route key={g.id} path={`/${g.id}`} element={<Game />} />;
            })}
            <Route path="*" element={<Hub />} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  );
}
