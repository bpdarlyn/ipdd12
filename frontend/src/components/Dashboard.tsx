import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiService from '../services/api';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorMessage from './ui/ErrorMessage';
import { CardLoader } from './ui/LoadingStates';
import ErrorBoundary from './ui/ErrorBoundary';
import './Dashboard.css';

interface DashboardStats {
  totalPersons: number;
  totalReports: number;
  recentReports: any[];
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [personsData, reportsData] = await Promise.all([
        apiService.getPersons(0, 1),
        apiService.getReports(0, 5)
      ]);

      setStats({
        totalPersons: personsData.length,
        totalReports: reportsData.length,
        recentReports: reportsData.slice(0, 5)
      });
    } catch (err: any) {
      setError(t('dashboard.loadError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="skeleton-line skeleton-title" style={{ width: '200px' }} />
          <div className="skeleton-line" style={{ width: '400px' }} />
        </div>
        <div className="dashboard-stats">
          {Array.from({ length: 2 }, (_, i) => (
            <CardLoader key={i} showImage={false} showActions={false} />
          ))}
        </div>
        <div className="dashboard-actions">
          <div className="skeleton-line skeleton-title" style={{ width: '150px' }} />
          <div className="action-buttons">
            <div className="skeleton-line skeleton-button" style={{ width: '140px' }} />
            <div className="skeleton-line skeleton-button" style={{ width: '160px' }} />
          </div>
        </div>
        <div className="recent-activity">
          <div className="skeleton-line skeleton-title" style={{ width: '180px' }} />
          <div className="reports-list">
            {Array.from({ length: 3 }, (_, i) => (
              <CardLoader key={i} showImage={false} showActions={true} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadDashboardData} />;
  }

  return (
    <ErrorBoundary>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{t('dashboard.title')}</h1>
          <p className="page-subtitle">{t('dashboard.welcome')}</p>
        </div>

        <div className="dashboard-stats">
          <ErrorBoundary>
            <div className="stat-card">
              <div className="stat-number">{stats?.totalPersons || 0}</div>
              <div className="stat-label">{t('dashboard.totalPersons')}</div>
              <Link to="/persons" className="stat-link">{t('dashboard.viewAll')}</Link>
            </div>
          </ErrorBoundary>

          <ErrorBoundary>
            <div className="stat-card">
              <div className="stat-number">{stats?.totalReports || 0}</div>
              <div className="stat-label">{t('dashboard.totalReports')}</div>
              <Link to="/reports" className="stat-link">{t('dashboard.viewAll')}</Link>
            </div>
          </ErrorBoundary>
        </div>

        <div className="dashboard-actions">
          <h2>{t('dashboard.quickActions')}</h2>
          <div className="action-buttons">
            <Link to="/persons/new" className="action-btn">
              {t('dashboard.addPerson')}
            </Link>
            <Link to="/reports/new" className="action-btn">
              {t('dashboard.createReport')}
            </Link>
          </div>
        </div>

        <div className="recent-activity">
          <h2>{t('dashboard.recentReports')}</h2>
          {stats?.recentReports && stats.recentReports.length > 0 ? (
            <div className="reports-list">
              {stats.recentReports.map((report: any) => (
                <ErrorBoundary key={report.id}>
                  <div className="report-item">
                    <div className="report-info">
                      <h3>{report.recurring_meeting?.report_type?.toUpperCase() || 'UNKNOWN'}</h3>
                      <p>{t('dashboard.meeting')}: {new Date(report.meeting_datetime).toLocaleDateString()}</p>
                      <p>{t('dashboard.attendance')}: {report.attendees_count}</p>
                      <p>{t('dashboard.location')}: {report.location}</p>
                    </div>
                    <Link to={`/reports/${report.id}`} className="view-btn">
                      {t('common.view')}
                    </Link>
                  </div>
                </ErrorBoundary>
              ))}
            </div>
          ) : (
            <p>{t('dashboard.noReports')} <Link to="/reports/new">{t('dashboard.createFirstReport')}</Link></p>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;