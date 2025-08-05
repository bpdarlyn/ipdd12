import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Person, PersonCreate, PersonUpdate } from '../../types/index';
import apiService from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import './PersonForm.css';

const PersonForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { t } = useTranslation();

  const [person, setPerson] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    phone: '',
    home_address: '',
    google_maps_link: '',
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadPerson(parseInt(id));
    }
  }, [isEdit, id]);

  const loadPerson = async (personId: number) => {
    try {
      setLoading(true);
      const data = await apiService.getPerson(personId);
      setPerson({
        first_name: data.first_name,
        last_name: data.last_name,
        birth_date: data.birth_date,
        phone: data.phone,
        home_address: data.home_address,
        google_maps_link: data.google_maps_link || '',
      });
    } catch (err: any) {
      setError(t('persons.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isEdit && id) {
        const updateData: PersonUpdate = {
          first_name: person.first_name,
          last_name: person.last_name,
          birth_date: person.birth_date,
          phone: person.phone,
          home_address: person.home_address,
          google_maps_link: person.google_maps_link || undefined,
        };
        await apiService.updatePerson(parseInt(id), updateData);
      } else {
        const createData: PersonCreate = {
          first_name: person.first_name,
          last_name: person.last_name,
          birth_date: person.birth_date,
          phone: person.phone,
          home_address: person.home_address,
          google_maps_link: person.google_maps_link || undefined,
        };
        await apiService.createPerson(createData);
      }
      navigate('/persons');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to save person';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPerson(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{isEdit ? t('persons.edit') : t('persons.createNew')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="person-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="first_name">{t('persons.firstName')} *</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={person.first_name}
              onChange={handleChange}
              required
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">{t('persons.lastName')} *</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={person.last_name}
              onChange={handleChange}
              required
              disabled={saving}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="birth_date">{t('persons.birthDate')} *</label>
            <input
              type="date"
              id="birth_date"
              name="birth_date"
              value={person.birth_date}
              onChange={handleChange}
              required
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">{t('persons.phone')} *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={person.phone}
              onChange={handleChange}
              required
              disabled={saving}
              placeholder={t('persons.phoneExample')}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="home_address">{t('persons.homeAddress')} *</label>
          <textarea
            id="home_address"
            name="home_address"
            value={person.home_address}
            onChange={handleChange}
            required
            disabled={saving}
            rows={3}
            placeholder={t('persons.enterFullAddress')}
          />
        </div>

        <div className="form-group">
          <label htmlFor="google_maps_link">{t('persons.googleMapsLink')} ({t('forms.optional')})</label>
          <input
            type="url"
            id="google_maps_link"
            name="google_maps_link"
            value={person.google_maps_link}
            onChange={handleChange}
            disabled={saving}
            placeholder="https://maps.google.com/..."
          />
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/persons')}
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
            {saving ? <LoadingSpinner size="small" message="" /> : (isEdit ? t('persons.updatePerson') : t('persons.createPerson'))}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonForm;