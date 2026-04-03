import { createBrowserRouter } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import CreateContractPage from '../pages/CreateContractPage';
import ContractDetailPage from '../pages/ContractDetailPage';
import JobBoardPage from '../pages/JobBoardPage';
import PostJobPage from '../pages/PostJobPage';
import JobDetailPage from '../pages/JobDetailPage';
import ProtectedRoute from '../components/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/',          element: <LandingPage /> },
  { path: '/login',     element: <LoginPage /> },
  { path: '/jobs',      element: <JobBoardPage /> },
  { path: '/jobs/:id',  element: <JobDetailPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/register',                    element: <RegisterPage /> },
      { path: '/dashboard',                   element: <DashboardPage /> },
      { path: '/dashboard/create',            element: <CreateContractPage /> },
      { path: '/dashboard/contract/:id',      element: <ContractDetailPage /> },
      { path: '/jobs/post',                   element: <PostJobPage /> },
    ],
  },
]);
