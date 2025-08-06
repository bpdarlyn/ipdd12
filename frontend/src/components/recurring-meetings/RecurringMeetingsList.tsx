import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { RecurringMeeting, ReportType, Periodicity } from '../../types/index';
import { apiService } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import './RecurringMeetingsList.css';

const RecurringMeetingsList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<RecurringMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getRecurringMeetings();
      setMeetings(data);
    } catch (err) {
      console.error('Error loading recurring meetings:', err);
      setError(t('recurringMeetings.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('recurringMeetings.deleteConfirm'))) {
      return;
    }

    try {
      await apiService.deleteRecurringMeeting(id);
      setMeetings(meetings.filter(m => m.id !== id));
    } catch (err) {
      console.error('Error deleting recurring meeting:', err);
      setError(t('recurringMeetings.deleteError'));
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
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

  return (
    <div className="recurring-meetings-list">
      <div className="list-header">
        <h1>{t('recurringMeetings.title')}</h1>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/recurring-meetings/new')}
        >
          {t('recurringMeetings.createNew')}
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {meetings.length === 0 ? (
        <div className="empty-state">
          <p>{t('recurringMeetings.noMeetings')}</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/recurring-meetings/new')}
          >
            {t('recurringMeetings.createFirst')}
          </button>
        </div>
      ) : (
        <div className="meetings-grid">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="meeting-card">
              <div className="card-header">
                <h3>{meeting.leader.first_name} {meeting.leader.last_name}</h3>
                <span className={`badge ${meeting.report_type}`}>
                  {getReportTypeLabel(meeting.report_type)}
                </span>
              </div>
              
              <div className="card-body">
                <div className="meeting-info">
                  <div className="info-row">
                    <strong>{t('recurringMeetings.meetingDateTime')}:</strong>
                    <span>{formatDateTime(meeting.meeting_datetime)}</span>
                  </div>
                  
                  <div className="info-row">
                    <strong>{t('recurringMeetings.periodicity')}:</strong>
                    <span>{getPeriodicityLabel(meeting.periodicity)}</span>
                  </div>
                  
                  <div className="info-row">
                    <strong>{t('recurringMeetings.location')}:</strong>
                    <span>{meeting.location}</span>
                  </div>
                  
                  {meeting.description && (
                    <div className="info-row description-row">
                      <strong>{t('recurringMeetings.description')}:</strong>
                      <span className="description">{meeting.description}</span>
                    </div>
                  )}
                  
                </div>
              </div>
              
              <div className="card-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => navigate(`/recurring-meetings/${meeting.id}`)}
                >
                  {t('common.view')}
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => navigate(`/recurring-meetings/${meeting.id}/edit`)}
                >
                  {t('common.edit')}
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDelete(meeting.id)}
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecurringMeetingsList;