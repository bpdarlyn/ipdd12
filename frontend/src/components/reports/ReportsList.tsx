import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Report } from '../../types/index';
import apiService from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import { CardLoader, LoadingButton } from '../ui/LoadingStates';
import { useMultipleLoading } from '../../hooks/useLoading';
import ErrorBoundary from '../ui/ErrorBoundary';
import { DateFormatter } from '../../utils/dateFormatter';
import './ReportsList.css';

const ReportsList: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { setLoading: setDeleteLoading, isLoading: isDeleting } = useMultipleLoading();
  const { t } = useTranslation();
  const dateFormatter = new DateFormatter(t);

  const getParticipantTypeLabel = (type: string): string => {
    switch (type) {
      case 'M': return t('forms.member');
      case 'V': return t('forms.visitor');
      case 'P': return t('forms.participant');
      default: return type;
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getReports();
      setReports(data);
    } catch (err: any) {
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('reports.deleteConfirm'))) {
      return;
    }

    const deleteKey = `delete-${id}`;
    try {
      setDeleteLoading(deleteKey, true);
      await apiService.deleteReport(id);
      setReports(reports.filter(r => r.id !== id));
    } catch (err: any) {
      alert('Failed to delete report');
    } finally {
      setDeleteLoading(deleteKey, false);
    }
  };


  const formatCurrency = (amount: number | string, currency: string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return `${currency} 0.00`;
    }
    return `${currency} ${numAmount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="reports-list">
        <div className="list-header">
          <h1>{t('reports.title')}</h1>
          <div className="skeleton-line skeleton-button" style={{ width: '150px' }} />
        </div>
        <div className="reports-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <CardLoader key={i} showImage={false} showActions={true} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadReports} />;
  }

  return (
    <ErrorBoundary>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{t('reports.title')}</h1>
          <div className="page-actions">
            <Link to="/reports/new" className="btn btn-primary">
              {t('reports.createNew')}
            </Link>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="empty-state">
            <p>{t('reports.noReports')}</p>
            <Link to="/reports/new" className="btn btn-primary">
              {t('reports.createFirst')}
            </Link>
          </div>
        ) : (
          <div className="reports-grid">
            {reports.map((report) => (
              <ErrorBoundary key={report.id}>
                <div className="report-card">
                  <div className="report-header">
                    <div className="report-type-badge">
                      {report.recurring_meeting?.leader?.first_name} - {report.recurring_meeting?.description}
                    </div>
                    <div className="report-date">
                      {dateFormatter.formatDate(report.registration_date)}
                    </div>
                  </div>
                  
                  <div className="report-info">
                    <div className="info-row">
                      <span className="label">{t('reports.location')}:</span>
                      <span className="value">{report.location}</span>
                    </div>
                    
                    <div className="info-row">
                      <span className="label">{t('reports.meetingDateTime')}:</span>
                      <span className="value">
                        {report.recurring_meeting?.meeting_datetime 
                          ? dateFormatter.formatMeetingDateTime(report.recurring_meeting.meeting_datetime)
                          : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="info-row">
                      <span className="label">{t('reports.attendees')}:</span>
                      <span className="value">{report.attendees_count}</span>
                    </div>
                    
                    <div className="info-row">
                      <span className="label">{t('reports.collection')}:</span>
                      <span className="value">
                        {formatCurrency(report.collection_amount, report.currency)}
                      </span>
                    </div>
                    
                    {report.collaborator && (
                      <div className="info-row">
                        <span className="label">{t('reports.collaborator')}:</span>
                        <span className="value">{report.collaborator}</span>
                      </div>
                    )}

                    {report.google_maps_link && (
                      <div className="info-row">
                        <a 
                          href={report.google_maps_link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="maps-link"
                        >
                          📍 {t('reports.viewOnMaps')}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="report-meta">
                    <small>
                      {t('reports.created')}: {dateFormatter.formatDate(report.created_at)}
                    </small>
                    {report.participants.length > 0 && (
                      <small>
                        {report.participants.length} {t('reports.participantsCount')}
                      </small>
                    )}
                  </div>

                  <div className="report-actions">
                    <Link to={`/reports/${report.id}`} className="btn btn-sm btn-outline">
                      {t('common.view')}
                    </Link>
                    <Link to={`/reports/${report.id}/edit`} className="btn btn-sm btn-outline">
                      {t('common.edit')}
                    </Link>
                    <LoadingButton
                      loading={isDeleting(`delete-${report.id}`)}
                      onClick={() => handleDelete(report.id)}
                      className="btn-sm btn-danger"
                      disabled={isDeleting(`delete-${report.id}`)}
                    >
                      {t('common.delete')}
                    </LoadingButton>
                  </div>
                </div>
              </ErrorBoundary>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ReportsList;