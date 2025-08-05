import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import LanguageSelector from '../ui/LanguageSelector';
import './Header.css';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <Link to="/dashboard" className="logo">
            <h1>IEM IPDD 12</h1>
          </Link>
        </div>

        <nav className="header-nav">
          <Link to="/dashboard" className="nav-link">{t('nav.dashboard')}</Link>
          <Link to="/persons" className="nav-link">{t('nav.persons')}</Link>
          <Link to="/reports" className="nav-link">{t('nav.reports')}</Link>
        </nav>

        <div className="header-right">
          <LanguageSelector />
          <div className="user-info">
            <span>Welcome, {user?.email}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;