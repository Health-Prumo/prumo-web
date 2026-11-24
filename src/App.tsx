import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Protegido } from './auth/Protegido';
import { Layout } from './components/Layout';
import { Carregando } from './components/Estado';
import { Cadastro } from './pages/Cadastro';
import { Coach } from './pages/Coach';
import { Consentimento } from './pages/Consentimento';
import { Entrar } from './pages/Entrar';
import { EsqueciSenha } from './pages/EsqueciSenha';
import { Hoje } from './pages/Hoje';
import { Perfil } from './pages/Perfil';
import { Registrar } from './pages/Registrar';

// O Histórico carrega o Recharts: fica num pedaço separado do bundle.
const Historico = lazy(() => import('./pages/Historico').then((m) => ({ default: m.Historico })));

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route element={<Protegido />}>
            <Route path="/consentimento" element={<Consentimento />} />
            <Route element={<Layout />}>
              <Route index element={<Hoje />} />
              <Route path="/registrar" element={<Registrar />} />
              <Route
                path="/historico"
                element={
                  <Suspense fallback={<Carregando />}>
                    <Historico />
                  </Suspense>
                }
              />
              <Route path="/coach" element={<Coach />} />
              <Route path="/perfil" element={<Perfil />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
