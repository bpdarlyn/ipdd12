import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Report } from '../../types/index';
import apiService from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import AttachmentsManager from './AttachmentsManager';
import './ReportDetail.css';

const ReportDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    if (id) {
      loadReport(parseInt(id));
    }
  }, [id]);

  const loadReport = async (reportId: number) => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getReport(reportId);
      setReport(data);
    } catch (err: any) {
      setError(t('reports.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!report || !window.confirm(t('reports.deleteConfirm'))) {
      return;
    }

    try {
      await apiService.deleteReport(report.id);
      navigate('/reports');
    } catch (err: any) {
      alert(t('reports.deleteError'));
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number | string, currency: string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return `${currency} 0.00`;
    }
    return `${currency} ${numAmount.toFixed(2)}`;
  };

  const getParticipantTypeLabel = (type: string): string => {
    switch (type) {
      case 'M': return t('forms.member');
      case 'V': return t('forms.visitor');
      case 'P': return t('forms.participant');
      default: return type;
    }
  };

  const getReportTypeLabel = (type: string): string => {
    switch (type) {
      case 'celula': return t('reports.celula');
      case 'culto': return t('reports.culto');
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const handleAttachmentsChange = (updatedAttachments: any[]) => {
    if (report) {
      setReport({ ...report, attachments: updatedAttachments });
    }
  };

  if (loading) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => id && loadReport(parseInt(id))} />;
  }

  if (!report) {
    return <ErrorMessage message={t('reports.loadError')} />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Link to="/reports" className="back-link">
          ← {t('reports.backToReports')}
        </Link>
        <div className="header-actions">
          <Link to={`/reports/${report.id}/edit`} className="btn btn-outline">
            {t('common.edit')}
          </Link>
          <button onClick={handleDelete} className="btn btn-danger">
            {t('common.delete')}
          </button>
        </div>
      </div>

      <div className="report-card">
        <div className="report-header">
          <div className="header-left">
            <h1>{getReportTypeLabel(report.report_type)} Report</h1>
            <div className="report-meta">
              <span className="report-id">ID: {report.id}</span>
              <span className="report-date">
                {t('reports.created')}: {formatDate(report.created_at)}
              </span>
            </div>
          </div>
          <div className="header-right">
            <div className="type-badge">
              {report.report_type.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="report-content">
          {/* Meeting Information */}
          <div className="info-section">
            <h3>📅 {t('reports.meetingInfo')}</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>{t('reports.registrationDate')}:</label>
                <span>{formatDateTime(report.registration_date)}</span>
              </div>
              <div className="info-item">
                <label>{t('reports.meetingDateTime')}:</label>
                <span>{formatDateTime(report.meeting_datetime)}</span>
              </div>
              <div className="info-item">
                <label>{t('reports.attendeesCount')}:</label>
                <span className="highlight">{report.attendees_count} {t('reports.attendees').toLowerCase()}</span>
              </div>
            </div>
          </div>

          {/* Leader Information */}
          <div className="info-section">
            <h3>👤 {t('reports.leaderInfo')}</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>{t('reports.leader')}:</label>
                <span>
                  {report.leader ? 
                    `${report.leader.first_name} ${report.leader.last_name}` : 
                    `Person ID: ${report.leader_person_id}`
                  }
                </span>
              </div>
              <div className="info-item">
                <label>{t('reports.leaderPhone')}:</label>
                <span>
                  <a href={`tel:${report.leader_phone}`} className="phone-link">
                    📞 {report.leader_phone}
                  </a>
                </span>
              </div>
              {report.collaborator && (
                <div className="info-item">
                  <label>{t('reports.collaborator')}:</label>
                  <span>{report.collaborator}</span>
                </div>
              )}
            </div>
          </div>

          {/* Location Information */}
          <div className="info-section">
            <h3>📍 {t('reports.locationInfo')}</h3>
            <div className="info-item full-width">
              <label>{t('reports.address')}:</label>
              <span className="address">{report.location}</span>
            </div>
            {report.google_maps_link && (
              <div className="info-item full-width">
                <a 
                  href={report.google_maps_link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="maps-link"
                >
                  🗺️ {t('reports.viewOnMaps')}
                </a>
              </div>
            )}
          </div>

          {/* Financial Information */}
          <div className="info-section">
            <h3>💰 {t('reports.collectionInfo')}</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>{t('reports.amountCollected')}:</label>
                <span className="currency-amount">
                  {formatCurrency(report.collection_amount, report.currency)}
                </span>
              </div>
              <div className="info-item">
                <label>{t('reports.currency')}:</label>
                <span>{report.currency === 'USD' ? t('forms.usd') : t('forms.bob')}</span>
              </div>
            </div>
          </div>

          {/* Participants Information */}
          {report.participants && report.participants.length > 0 && (
            <div className="info-section">
              <h3>👥 {t('reports.participants')} ({report.participants.length})</h3>
              <div className="participants-list">
                {report.participants.map((participant) => (
                  <div key={participant.id} className="participant-item">
                    <div className="participant-info">
                      <span className="participant-name">{participant.participant_name}</span>
                      <span className="participant-type">
                        {getParticipantTypeLabel(participant.participant_type)}
                      </span>
                    </div>
                    <small className="participant-meta">
                      {t('common.created')}: {formatDate(participant.created_at)}
                    </small>
                  </div>
                ))}
              </div>
              
              {/* Participants Summary */}
              <div className="participants-summary">
                <div className="summary-item">
                  <span className="label">{t('reports.members')}:</span>
                  <span className="count">
                    {report.participants.filter(p => p.participant_type === 'M').length}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">{t('reports.visitors')}:</span>
                  <span className="count">
                    {report.participants.filter(p => p.participant_type === 'V').length}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">{t('reports.participantsCount')}:</span>
                  <span className="count">
                    {report.participants.filter(p => p.participant_type === 'P').length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Attachments Information */}
          <div className="info-section">
            <h3>📎 {t('reports.attachments')}</h3>
            <AttachmentsManager
              reportId={report.id}
              attachments={report.attachments || []}
              onAttachmentsChange={handleAttachmentsChange}
              readonly={false}
            />
          </div>

          {/* System Information */}
          <div className="info-section">
            <h3>⚙️ {t('reports.systemInfo')}</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>{t('reports.created')}:</label>
                <span>{formatDateTime(report.created_at)}</span>
              </div>
              <div className="info-item">
                <label>{t('reports.lastUpdated')}:</label>
                <span>{formatDateTime(report.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;