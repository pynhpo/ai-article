import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import Home from './pages/Home';
import Account from './pages/Account';
import { ErrorBoundary } from './components/error-boundary';
import './index.css';

import { MainLayout } from './components/main-layout';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <MainLayout>
          <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-transparent text-white/50 text-sm animate-pulse">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/account" element={<Account />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </MainLayout>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
