import { createBrowserRouter } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import CreateContractPage from '../pages/CreateContractPage';
import ContractDetailPage from '../pages/ContractDetailPage';
import JobBoardPage from '../pages/JobBoardPage';
import PostJobPage from '../pages/PostJobPage';
import JobDetailPage from '../pages/JobDetailPage';
import FreelancersPage from '../pages/FreelancersPage';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleRoute from '../components/RoleRoute';

export const router = createBrowserRouter([
  { path: '/',            element: <LandingPage /> },
  { path: '/login',       element: <LoginPage /> },
  { path: '/jobs',        element: <JobBoardPage /> },
  { path: '/jobs/:id',    element: <JobDetailPage /> },
  { path: '/freelancers', element: <FreelancersPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/register',               element: <RegisterPage /> },
      { path: '/dashboard',              element: <DashboardPage /> },
      { path: '/profile',                element: <ProfilePage /> },
      { path: '/dashboard/contract/:id', element: <ContractDetailPage /> },

      // ── Client-only routes ──────────────────────────────────────────────────
      {
        element: <RoleRoute allowedRoles={['client']} />,
        children: [
          { path: '/dashboard/create', element: <CreateContractPage /> },
          { path: '/jobs/post',        element: <PostJobPage /> },
        ],
      },
    ],
  },
]);
