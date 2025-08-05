import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Person } from '../../types/index';
import apiService from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import { CardLoader } from '../ui/LoadingStates';
import ErrorBoundary from '../ui/ErrorBoundary';
import './PersonsList.css';

const PersonsList: React.FC = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getPersons();
      setPersons(data);
    } catch (err: any) {
      setError(t('persons.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('persons.deleteConfirm'))) {
      return;
    }

    try {
      await apiService.deletePerson(id);
      setPersons(persons.filter(p => p.id !== id));
    } catch (err: any) {
      alert(t('persons.deleteError'));
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{t('persons.title')}</h1>
          <div className="skeleton-line skeleton-button" style={{ width: '120px' }} />
        </div>
        <div className="persons-grid">
          {Array.from({ length: 8 }, (_, i) => (
            <CardLoader key={i} showImage={false} showActions={true} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadPersons} />;
  }

  return (
    <ErrorBoundary>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{t('persons.title')}</h1>
          <div className="page-actions">
            <Link to="/persons/new" className="btn btn-primary">
              {t('persons.createNew')}
            </Link>
          </div>
        </div>

        {persons.length === 0 ? (
          <div className="empty-state">
            <p>{t('persons.noPersons')}</p>
            <Link to="/persons/new" className="btn btn-primary">
              {t('persons.createFirst')}
            </Link>
          </div>
        ) : (
          <div className="persons-grid">
            {persons.map((person) => (
              <ErrorBoundary key={person.id}>
                <div className="person-card">
                  <div className="person-info">
                    <h3>{person.first_name} {person.last_name}</h3>
                    <p className="person-phone">📞 {person.phone}</p>
                    <p className="person-birth-date">🎂 {new Date(person.birth_date).toLocaleDateString()}</p>
                    <p className="person-address">📍 {person.home_address}</p>
                    {person.google_maps_link && (
                      <a href={person.google_maps_link} target="_blank" rel="noopener noreferrer" className="maps-link">
                        📍 {t('persons.viewOnMaps')}
                      </a>
                    )}
                  </div>
                  <div className="person-actions">
                    <Link to={`/persons/${person.id}`} className="btn btn-sm btn-outline">
                      {t('common.view')}
                    </Link>
                    <Link to={`/persons/${person.id}/edit`} className="btn btn-sm btn-outline">
                      {t('common.edit')}
                    </Link>
                    <button
                      onClick={() => handleDelete(person.id)}
                      className="btn btn-sm btn-danger"
                    >
                      {t('common.delete')}
                    </button>
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

export default PersonsList;