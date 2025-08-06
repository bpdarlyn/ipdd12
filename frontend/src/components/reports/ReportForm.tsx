import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Report, ReportCreate, ReportUpdate, Currency, Person, ReportParticipantCreate, ParticipantType, RecurringMeeting } from '../../types/index';
import apiService from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import AttachmentsManager from './AttachmentsManager';
import './ReportForm.css';

const ReportForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { t } = useTranslation();

  const getParticipantTypeLabel = (type: ParticipantType): string => {
    switch (type) {
      case 'MEMBER': return t('forms.member');
      case 'VISITOR': return t('forms.visitor');
      case 'PARTICIPANT': return t('forms.participant');
      default: return type;
    }
  };

  const [report, setReport] = useState({
    registration_date: '',
    meeting_datetime: '',
    recurring_meeting_id: 0,
    leader_person_id: 0,
    leader_phone: '',
    collaborator: '',
    location: '',
    collection_amount: 0,
    currency: 'USD' as Currency,
    attendees_count: 0,
    google_maps_link: '',
    participants: [] as ReportParticipantCreate[],
  });

  const [persons, setPersons] = useState<Person[]>([]);
  const [recurringMeetings, setRecurringMeetings] = useState<RecurringMeeting[]>([]);
  const [newParticipant, setNewParticipant] = useState({
    participant_name: '',
    participant_type: 'MEMBER' as ParticipantType,
  });
  const [loadedReport, setLoadedReport] = useState<Report | null>(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPersons();
    loadRecurringMeetings();
    if (isEdit && id) {
      loadReport(parseInt(id));
    } else {
      // Set default registration date to now
      const now = new Date();
      setReport(prev => ({
        ...prev,
        registration_date: now.toISOString().slice(0, 16), // Format for datetime-local input
      }));
    }
  }, [isEdit, id]);

  const loadPersons = async () => {
    try {
      const data = await apiService.getPersons();
      setPersons(data);
    } catch (err: any) {
      console.error('Failed to load persons:', err);
    }
  };

  const loadRecurringMeetings = async () => {
    try {
      const data = await apiService.getRecurringMeetings();
      setRecurringMeetings(data);
    } catch (err: any) {
      console.error('Failed to load recurring meetings:', err);
    }
  };

  const loadReport = async (reportId: number) => {
    try {
      setLoading(true);
      const data = await apiService.getReport(reportId);
      setLoadedReport(data); // Store the full report for attachments
      setReport({
        registration_date: data.registration_date.slice(0, 16), // Format for datetime-local input
        meeting_datetime: data.meeting_datetime.slice(0, 16),
        recurring_meeting_id: data.recurring_meeting_id,
        leader_person_id: data.leader_person_id,
        leader_phone: data.leader_phone,
        collaborator: data.collaborator || '',
        location: data.location,
        collection_amount: typeof data.collection_amount === 'string' ? parseFloat(data.collection_amount) : data.collection_amount,
        currency: data.currency,
        attendees_count: data.attendees_count,
        google_maps_link: data.google_maps_link || '',
        participants: data.participants.map(p => ({
          participant_name: p.participant_name,
          participant_type: p.participant_type,
        })),
      });
    } catch (err: any) {
      setError(t('reports.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const reportData = {
        ...report,
        registration_date: new Date(report.registration_date).toISOString(),
        meeting_datetime: new Date(report.meeting_datetime).toISOString(),
        collaborator: report.collaborator || undefined,
        google_maps_link: report.google_maps_link || undefined,
      };

      if (isEdit && id) {
        const updateData: ReportUpdate = reportData;
        await apiService.updateReport(parseInt(id), updateData);
      } else {
        const createData: ReportCreate = reportData;
        await apiService.createReport(createData);
      }
      navigate('/reports');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to save report';
      setError(Array.isArray(errorMessage) ? 
        errorMessage.map((e: any) => `${e.loc.join('.')}: ${e.msg}`).join('\n') : 
        errorMessage
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setReport(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handlePersonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const personId = parseInt(e.target.value);
    const selectedPerson = persons.find(p => p.id === personId);
    if (selectedPerson) {
      setReport(prev => ({
        ...prev,
        leader_person_id: personId,
        leader_phone: selectedPerson.phone,
      }));
    }
  };

  const handleRecurringMeetingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const meetingId = parseInt(e.target.value);
    const selectedMeeting = recurringMeetings.find(m => m.id === meetingId);
    if (selectedMeeting) {
      const selectedPerson = selectedMeeting.leader;
      setReport(prev => ({
        ...prev,
        recurring_meeting_id: meetingId,
        leader_person_id: selectedMeeting.leader_person_id,
        leader_phone: selectedPerson?.phone || '',
        location: selectedMeeting.location,
        google_maps_link: selectedMeeting.google_maps_link || '',
        meeting_datetime: selectedMeeting.meeting_datetime.slice(0, 16),
      }));
    }
  };

  const addParticipant = () => {
    if (newParticipant.participant_name.trim()) {
      setReport(prev => ({
        ...prev,
        participants: [...prev.participants, { ...newParticipant }],
      }));
      setNewParticipant({
        participant_name: '',
        participant_type: 'MEMBER',
      });
    }
  };

  const removeParticipant = (index: number) => {
    setReport(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index),
    }));
  };

  const handleAttachmentsChange = (updatedAttachments: any[]) => {
    if (loadedReport) {
      setLoadedReport({ ...loadedReport, attachments: updatedAttachments });
    }
  };

  if (loading) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{isEdit ? t('reports.edit') : t('reports.createNew')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-section">
          <h3>{t('reports.basicInfo')}</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="recurring_meeting_id">{t('reports.recurringMeeting')} *</label>
              <select
                id="recurring_meeting_id"
                name="recurring_meeting_id"
                value={report.recurring_meeting_id}
                onChange={handleRecurringMeetingChange}
                required
                disabled={saving}
              >
                <option value="">{t('reports.selectRecurringMeeting')}</option>
                {recurringMeetings.map((meeting) => (
                  <option key={meeting.id} value={meeting.id}>
                    {t(`recurringMeetings.${meeting.report_type}`)} - {meeting.leader?.first_name} - {meeting.description}
                  </option>
                ))}
              </select>
            </div>


            <div className="form-group">
              <label htmlFor="registration_date">{t('reports.registrationDate')} *</label>
              <input
                type="datetime-local"
                id="registration_date"
                name="registration_date"
                value={report.registration_date}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="meeting_datetime">{t('reports.meetingDateTime')} *</label>
              <input
                type="datetime-local"
                id="meeting_datetime"
                name="meeting_datetime"
                value={report.meeting_datetime}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="attendees_count">{t('reports.attendeesCount')} *</label>
              <input
                type="number"
                id="attendees_count"
                name="attendees_count"
                value={report.attendees_count}
                onChange={handleChange}
                required
                min="0"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>{t('reports.leaderInfo')}</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="leader_person_id">{t('reports.leader')} *</label>
              <select
                id="leader_person_id"
                name="leader_person_id"
                value={report.leader_person_id}
                onChange={handlePersonChange}
                required
                disabled={saving}
              >
                <option value="">{t('reports.selectLeader')}</option>
                {persons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.first_name} {person.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="leader_phone">{t('reports.leaderPhone')} *</label>
              <input
                type="tel"
                id="leader_phone"
                name="leader_phone"
                value={report.leader_phone}
                onChange={handleChange}
                required
                disabled={saving}
                placeholder={t('reports.autoFilledPhone')}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="collaborator">{t('reports.collaborator')} ({t('forms.optional')})</label>
            <input
              type="text"
              id="collaborator"
              name="collaborator"
              value={report.collaborator}
              onChange={handleChange}
              disabled={saving}
              placeholder={t('reports.collaboratorOptional')}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>{t('reports.locationCollection')}</h3>
          
          <div className="form-group">
            <label htmlFor="location">{t('reports.location')} *</label>
            <textarea
              id="location"
              name="location"
              value={report.location}
              onChange={handleChange}
              required
              disabled={saving}
              rows={2}
              placeholder={t('reports.meetingLocationAddress')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="google_maps_link">{t('reports.googleMapsLink')} ({t('forms.optional')})</label>
            <input
              type="url"
              id="google_maps_link"
              name="google_maps_link"
              value={report.google_maps_link}
              onChange={handleChange}
              disabled={saving}
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="collection_amount">{t('reports.collectionAmount')} *</label>
              <input
                type="number"
                id="collection_amount"
                name="collection_amount"
                value={report.collection_amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="currency">{t('reports.currency')} *</label>
              <select
                id="currency"
                name="currency"
                value={report.currency}
                onChange={handleChange}
                required
                disabled={saving}
              >
                <option value="USD">USD - {t('forms.usd')}</option>
                <option value="BOB">BOB - {t('forms.bob')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>{t('reports.participants')}</h3>
          
          <div className="participants-section">
            <div className="add-participant">
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    placeholder={t('forms.participantName')}
                    value={newParticipant.participant_name}
                    onChange={(e) => setNewParticipant(prev => ({
                      ...prev,
                      participant_name: e.target.value
                    }))}
                    disabled={saving}
                  />
                </div>
                <div className="form-group">
                  <select
                    value={newParticipant.participant_type}
                    onChange={(e) => setNewParticipant(prev => ({
                      ...prev,
                      participant_type: e.target.value as ParticipantType
                    }))}
                    disabled={saving}
                  >
                    <option value="MEMBER">{t('forms.member')}</option>
                    <option value="VISITOR">{t('forms.visitor')}</option>
                    <option value="PARTICIPANT">{t('forms.participant')}</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={addParticipant}
                  className="btn btn-outline"
                  disabled={saving}
                >
                  {t('forms.add')}
                </button>
              </div>
            </div>

            {report.participants.length > 0 && (
              <div className="participants-list">
                <h4>{t('reports.addedParticipants')} ({report.participants.length})</h4>
                {report.participants.map((participant, index) => (
                  <div key={index} className="participant-item">
                    <span className="participant-name">{participant.participant_name}</span>
                    <span className="participant-type">{getParticipantTypeLabel(participant.participant_type)}</span>
                    <button
                      type="button"
                      onClick={() => removeParticipant(index)}
                      className="btn-remove"
                      disabled={saving}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Attachments Section - Only show for edit mode */}
        {isEdit && loadedReport && (
          <div className="form-section">
            <h3>{t('reports.attachments')}</h3>
            <AttachmentsManager
              reportId={loadedReport.id}
              attachments={loadedReport.attachments || []}
              onAttachmentsChange={handleAttachmentsChange}
              readonly={false}
            />
          </div>
        )}

        {error && <ErrorMessage message={error} />}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="btn btn-outline"
            disabled={saving}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? <LoadingSpinner size="small" message="" /> : (isEdit ? t('reports.updateReport') : t('reports.createReport'))}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;