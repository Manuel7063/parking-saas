import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Caseta from './pages/Caseta';
import Configuracion from './pages/Configuracion';
import MasterPanel from './pages/MasterPanel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/caseta" element={<Caseta />} />
        <Route path="/config" element={<Configuracion />} />
        <Route path="/master" element={<MasterPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
