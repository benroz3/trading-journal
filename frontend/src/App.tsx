import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import TradeLog from './pages/TradeLog';
import TradeForm from './pages/TradeForm';
import TradeDetail from './pages/TradeDetail';
import Strategies from './pages/Strategies';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/trades" element={<TradeLog />} />
        <Route path="/trades/new" element={<TradeForm />} />
        <Route path="/trades/:id" element={<TradeDetail />} />
        <Route path="/trades/:id/edit" element={<TradeForm />} />
        <Route path="/strategies" element={<Strategies />} />
      </Routes>
    </Layout>
  );
}

export default App;
