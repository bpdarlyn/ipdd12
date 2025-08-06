import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import type { RecurringMeeting, ReportType, Periodicity } from '../../types';
import { apiService } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import './RecurringMeetingDetail.css';

const RecurringMeetingDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [meeting, setMeeting] = useState<RecurringMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadMeeting(parseInt(id));
    }
  }, [id]);

  const loadMeeting = async (meetingId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getRecurringMeeting(meetingId);
      setMeeting(data);
    } catch (err) {
      console.error('Error loading recurring meeting:', err);
      setError(t('recurringMeetings.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!meeting || !window.confirm(t('recurringMeetings.deleteConfirm'))) {
      return;
    }

    try {
      setDeleting(true);
      await apiService.deleteRecurringMeeting(meeting.id);
      navigate('/recurring-meetings');
    } catch (err) {
      console.error('Error deleting recurring meeting:', err);
      setError(t('recurringMeetings.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString();
  };

  const getReportTypeLabel = (type: ReportType) => {
    return t(`recurringMeetings.${type}`);
  };

  const getPeriodicityLabel = (periodicity: Periodicity) => {
    return t(`recurringMeetings.${periodicity.toLowerCase()}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && !meeting) {
    return (
      <div className="recurring-meeting-detail">
        <div className="detail-header">
          <button 
            className="btn btn-outline"
            onClick={() => navigate('/recurring-meetings')}
          >
            {t('recurringMeetings.backToMeetings')}
          </button>
        </div>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="recurring-meeting-detail">
        <div className="detail-header">
          <button 
            className="btn btn-outline"
            onClick={() => navigate('/recurring-meetings')}
          >
            {t('recurringMeetings.backToMeetings')}
          </button>
        </div>
        <div className="not-found">
          <h2>{t('recurringMeetings.meetingNotFound')}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="recurring-meeting-detail">
      <div className="detail-header">
        <div className="header-left">
          <button 
            className="btn btn-outline"
            onClick={() => navigate('/recurring-meetings')}
          >
            {t('recurringMeetings.backToMeetings')}
          </button>
          <h1>{getReportTypeLabel(meeting.report_type)} - {getPeriodicityLabel(meeting.periodicity)}</h1>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-outline"
            onClick={() => navigate(`/recurring-meetings/${meeting.id}/edit`)}
          >
            {t('common.edit')}
          </button>
          <button 
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? t('common.loading') : t('common.delete')}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="detail-content">
        <div className="detail-section">
          <h2>{t('recurringMeetings.meetingInfo')}</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>{t('recurringMeetings.meetingDateTime')}</label>
              <span>{formatDateTime(meeting.meeting_datetime)}</span>
            </div>
            <div className="info-item">
              <label>{t('recurringMeetings.reportType')}</label>
              <span className={`badge ${meeting.report_type}`}>
                {getReportTypeLabel(meeting.report_type)}
              </span>
            </div>
            <div className="info-item">
              <label>{t('recurringMeetings.periodicity')}</label>
              <span className="badge periodicity">
                {getPeriodicityLabel(meeting.periodicity)}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>{t('recurringMeetings.leaderInfo')}</h2>
          <div className="info-grid">
            {meeting.leader && (
              <>
                <div className="info-item">
                  <label>{t('recurringMeetings.leader')}</label>
                  <span>{meeting.leader.first_name} {meeting.leader.last_name}</span>
                </div>
                <div className="info-item">
                  <label>{t('persons.phone')}</label>
                  <span>{meeting.leader.phone}</span>
                </div>
                <div className="info-item">
                  <label>{t('persons.homeAddress')}</label>
                  <span>{meeting.leader.home_address}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="detail-section">
          <h2>{t('recurringMeetings.locationInfo')}</h2>
          <div className="info-grid">
            <div className="info-item full-width">
              <label>{t('recurringMeetings.location')}</label>
              <span>{meeting.location}</span>
            </div>
            {meeting.google_maps_link && (
              <div className="info-item full-width">
                <label>{t('recurringMeetings.googleMapsLink')}</label>
                <a 
                  href={meeting.google_maps_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="maps-link"
                >
                  {t('recurringMeetings.viewOnMaps')}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="detail-section">
          <div className="section-header">
            <h2>{t('recurringMeetings.reportsCount')}</h2>
            <button 
              className="btn btn-outline"
              onClick={() => navigate(`/reports?recurring_meeting_id=${meeting.id}`)}
            >
              {t('recurringMeetings.viewReports')}
            </button>
          </div>
          <div className="reports-placeholder">
            <p>{t('recurringMeetings.viewReportsMessage')}</p>
          </div>
        </div>

        <div className="detail-section">
          <h2>{t('recurringMeetings.systemInfo')}</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>{t('recurringMeetings.created')}</label>
              <span>{formatDateTime(meeting.created_at)}</span>
            </div>
            <div className="info-item">
              <label>{t('recurringMeetings.lastUpdated')}</label>
              <span>{formatDateTime(meeting.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringMeetingDetail;