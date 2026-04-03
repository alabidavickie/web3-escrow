import { createBrowserRouter } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import CreateContractPage from '../pages/CreateContractPage';
import ContractDetailPage from '../pages/ContractDetailPage';
import ProtectedRoute from '../components/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/register', element: <RegisterPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/dashboard/create', element: <CreateContractPage /> },
      { path: '/dashboard/contract/:id', element: <ContractDetailPage /> },
    ],
  },
]);
