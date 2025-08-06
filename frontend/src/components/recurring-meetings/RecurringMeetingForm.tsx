import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import type { RecurringMeetingCreate, RecurringMeetingUpdate, Person } from '../../types';
import { ReportType, Periodicity } from '../../types';
import { apiService } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import './RecurringMeetingForm.css';

const RecurringMeetingForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<RecurringMeetingCreate>({
    meeting_datetime: '',
    leader_person_id: 0,
    report_type: ReportType.CELULA,
    location: '',
    description: '',
    periodicity: Periodicity.WEEKLY,
    google_maps_link: ''
  });

  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPersons();
    if (isEditing && id) {
      loadRecurringMeeting(parseInt(id));
    }
  }, [id, isEditing]);

  const loadPersons = async () => {
    try {
      const data = await apiService.getPersons();
      setPersons(data);
    } catch (err) {
      console.error('Error loading persons:', err);
      setError(t('persons.loadError'));
    }
  };

  const loadRecurringMeeting = async (meetingId: number) => {
    try {
      setLoading(true);
      const meeting = await apiService.getRecurringMeeting(meetingId);
      setFormData({
        meeting_datetime: meeting.meeting_datetime.slice(0, 16), // Format for datetime-local input
        leader_person_id: meeting.leader_person_id,
        report_type: meeting.report_type,
        location: meeting.location,
        description: meeting.description || '',
        periodicity: meeting.periodicity,
        google_maps_link: meeting.google_maps_link || ''
      });
    } catch (err) {
      console.error('Error loading recurring meeting:', err);
      setError(t('recurringMeetings.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'leader_person_id' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.meeting_datetime || !formData.leader_person_id || !formData.location) {
        setError(t('forms.required'));
        return;
      }

      if (isEditing && id) {
        const updateData: RecurringMeetingUpdate = { ...formData };
        await apiService.updateRecurringMeeting(parseInt(id), updateData);
      } else {
        await apiService.createRecurringMeeting(formData);
      }

      navigate('/recurring-meetings');
    } catch (err) {
      console.error('Error saving recurring meeting:', err);
      setError(isEditing ? t('recurringMeetings.updateError') : t('recurringMeetings.createError'));
    } finally {
      setSaving(false);
    }
  };

  const getPersonName = (person: Person) => {
    return `${person.first_name} ${person.last_name}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="recurring-meeting-form">
      <div className="form-header">
        <h1>
          {isEditing ? t('recurringMeetings.edit') : t('recurringMeetings.createNew')}
        </h1>
        <button 
          type="button"
          className="btn btn-outline"
          onClick={() => navigate('/recurring-meetings')}
        >
          {t('recurringMeetings.backToMeetings')}
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h2>{t('recurringMeetings.meetingInfo')}</h2>
          
          <div className="form-group">
            <label htmlFor="meeting_datetime" className="required">
              {t('recurringMeetings.meetingDateTime')}
            </label>
            <input
              type="datetime-local"
              id="meeting_datetime"
              name="meeting_datetime"
              value={formData.meeting_datetime}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="report_type" className="required">
              {t('recurringMeetings.reportType')}
            </label>
            <select
              id="report_type"
              name="report_type"
              value={formData.report_type}
              onChange={handleInputChange}
              required
            >
              <option value="">{t('recurringMeetings.selectReportType')}</option>
              <option value={ReportType.CELULA}>{t('recurringMeetings.celula')}</option>
              <option value={ReportType.CULTO}>{t('recurringMeetings.culto')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="periodicity" className="required">
              {t('recurringMeetings.periodicity')}
            </label>
            <select
              id="periodicity"
              name="periodicity"
              value={formData.periodicity}
              onChange={handleInputChange}
              required
            >
              <option value="">{t('recurringMeetings.selectPeriodicity')}</option>
              <option value={Periodicity.DAILY}>{t('recurringMeetings.daily')}</option>
              <option value={Periodicity.WEEKLY}>{t('recurringMeetings.weekly')}</option>
              <option value={Periodicity.MONTHLY}>{t('recurringMeetings.monthly')}</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2>{t('recurringMeetings.leaderInfo')}</h2>
          
          <div className="form-group">
            <label htmlFor="leader_person_id" className="required">
              {t('recurringMeetings.leader')}
            </label>
            <select
              id="leader_person_id"
              name="leader_person_id"
              value={formData.leader_person_id}
              onChange={handleInputChange}
              required
            >
              <option value="">{t('recurringMeetings.selectLeader')}</option>
              {persons.map((person) => (
                <option key={person.id} value={person.id}>
                  {getPersonName(person)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2>{t('recurringMeetings.locationInfo')}</h2>
          
          <div className="form-group">
            <label htmlFor="location" className="required">
              {t('recurringMeetings.location')}
            </label>
            <textarea
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder={t('recurringMeetings.meetingLocationAddress')}
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">
              {t('recurringMeetings.description')} ({t('forms.optional')})
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t('recurringMeetings.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="google_maps_link">
              {t('recurringMeetings.googleMapsLink')} ({t('forms.optional')})
            </label>
            <input
              type="url"
              id="google_maps_link"
              name="google_maps_link"
              value={formData.google_maps_link}
              onChange={handleInputChange}
              placeholder="https://maps.google.com/..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/recurring-meetings')}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? t('common.loading') : 
             isEditing ? t('recurringMeetings.updateMeeting') : t('recurringMeetings.createMeeting')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecurringMeetingForm;