import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Person } from '../../types/index';
import apiService from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import { DateFormatter } from '../../utils/dateFormatter';
import './PersonDetail.css';

const PersonDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const dateFormatter = new DateFormatter(t);

  useEffect(() => {
    if (id) {
      loadPerson(parseInt(id));
    }
  }, [id]);

  const loadPerson = async (personId: number) => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getPerson(personId);
      setPerson(data);
    } catch (err: any) {
      setError(t('persons.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!person || !window.confirm(t('persons.deleteConfirm'))) {
      return;
    }

    try {
      await apiService.deletePerson(person.id);
      navigate('/persons');
    } catch (err: any) {
      alert(t('persons.deleteError'));
    }
  };

  if (loading) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => id && loadPerson(parseInt(id))} />;
  }

  if (!person) {
    return <ErrorMessage message={t('persons.loadError')} />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Link to="/persons" className="back-link">
          ← {t('persons.backToPersons')}
        </Link>
        <div className="header-actions">
          <Link to={`/persons/${person.id}/edit`} className="btn btn-outline">
            {t('common.edit')}
          </Link>
          <button onClick={handleDelete} className="btn btn-danger">
            {t('common.delete')}
          </button>
        </div>
      </div>

      <div className="person-card">
        <div className="person-header">
          <h1>{person.first_name} {person.last_name}</h1>
        </div>

        <div className="person-info">
          <div className="info-group">
            <h3>{t('persons.personalInfo')}</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>{t('persons.birthDate')}:</label>
                <span>{dateFormatter.formatBirthDate(person.birth_date)}</span>
              </div>
              <div className="info-item">
                <label>{t('persons.phone')}:</label>
                <span>{person.phone}</span>
              </div>
            </div>
          </div>

          <div className="info-group">
            <h3>{t('persons.addressInfo')}</h3>
            <div className="info-item">
              <label>{t('persons.homeAddress')}:</label>
              <span>{person.home_address}</span>
            </div>
            {person.google_maps_link && (
              <div className="info-item">
                <label>{t('persons.googleMapsLink')}:</label>
                <a href={person.google_maps_link} target="_blank" rel="noopener noreferrer" className="maps-link">
                  📍 {t('persons.viewOnMaps')}
                </a>
              </div>
            )}
          </div>

          <div className="info-group">
            <h3>{t('persons.systemInfo')}</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>{t('persons.created')}:</label>
                <span>{new Date(person.created_at).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <label>{t('persons.lastUpdated')}:</label>
                <span>{new Date(person.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonDetail;