import { useAuth } from '../../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { LeaderDashboard } from './LeaderDashboard';
import { UserDashboard } from './UserDashboard';
import { DashboardLayout } from './DashboardLayout';
import type { UserRole } from '../../types/auth';
import type { FC } from 'react';

const dashboardComponents: Record<UserRole, FC> = {
  admin: AdminDashboard,
  lider: LeaderDashboard,
  usuario: UserDashboard,
};

export const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const DashboardComponent = dashboardComponents[user.role];

  return (
    <DashboardLayout>
      <DashboardComponent />
    </DashboardLayout>
  );
};