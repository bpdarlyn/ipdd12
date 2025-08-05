import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import './LoadingStates.css';

// Full page loading overlay
export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <LoadingSpinner overlay message={message} size="large" />
);

// Card/Section skeleton loader
export const SkeletonLoader: React.FC<{ 
  lines?: number; 
  height?: string;
  className?: string;
}> = ({ lines = 3, height = '1rem', className = '' }) => (
  <div className={`skeleton-loader ${className}`}>
    {Array.from({ length: lines }, (_, i) => (
      <div 
        key={i} 
        className="skeleton-line" 
        style={{ 
          height,
          width: i === lines - 1 ? '70%' : '100%' 
        }} 
      />
    ))}
  </div>
);

// Table loading state with skeleton rows
export const TableLoader: React.FC<{ 
  rows?: number; 
  columns?: number;
}> = ({ rows = 5, columns = 4 }) => (
  <div className="table-loader">
    <div className="table">
      <thead>
        <tr>
          {Array.from({ length: columns }, (_, i) => (
            <th key={i}>
              <div className="skeleton-line skeleton-header" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: columns }, (_, colIndex) => (
              <td key={colIndex}>
                <div className="skeleton-line" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </div>
  </div>
);

// Card loading state
export const CardLoader: React.FC<{ 
  showImage?: boolean;
  showActions?: boolean;
}> = ({ showImage = false, showActions = true }) => (
  <div className="card card-loader">
    {showImage && (
      <div className="card-image-skeleton">
        <div className="skeleton-line" style={{ height: '200px' }} />
      </div>
    )}
    <div className="card-body">
      <div className="skeleton-line skeleton-title" />
      <SkeletonLoader lines={3} />
    </div>
    {showActions && (
      <div className="card-footer">
        <div className="skeleton-actions">
          <div className="skeleton-line skeleton-button" />
          <div className="skeleton-line skeleton-button" />
        </div>
      </div>
    )}
  </div>
);

// List item loading state
export const ListItemLoader: React.FC<{ 
  showAvatar?: boolean;
  showMeta?: boolean;
}> = ({ showAvatar = false, showMeta = true }) => (
  <div className="list-item-loader">
    {showAvatar && <div className="skeleton-avatar" />}
    <div className="list-item-content">
      <div className="skeleton-line skeleton-title" />
      <SkeletonLoader lines={showMeta ? 2 : 1} />
    </div>
  </div>
);

// Button loading state
export const LoadingButton: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}> = ({ loading, children, className = '', disabled, onClick, type = 'button' }) => (
  <button
    type={type}
    className={`btn ${className} ${loading ? 'btn-loading' : ''}`}
    disabled={disabled || loading}
    onClick={onClick}
  >
    {children}
  </button>
);

// Form loading overlay
export const FormLoader: React.FC<{ message?: string }> = ({ message = 'Saving...' }) => (
  <div className="form-loader">
    <div className="form-loader-content">
      <LoadingSpinner size="medium" message={message} />
    </div>
  </div>
);

// Search/Filter loading state
export const SearchLoader: React.FC = () => (
  <div className="search-loader">
    <div className="search-loader-content">
      <LoadingSpinner size="small" message="" className="loading-inline" />
      <span>Searching...</span>
    </div>
  </div>
);

// Progress bar loading state
export const ProgressLoader: React.FC<{ 
  progress: number; 
  message?: string;
  showPercentage?: boolean;
}> = ({ progress, message, showPercentage = true }) => (
  <div className="progress-loader">
    {message && <div className="progress-message">{message}</div>}
    <div className="progress-bar">
      <div 
        className="progress-fill" 
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
    {showPercentage && (
      <div className="progress-percentage">
        {Math.round(progress)}%
      </div>
    )}
  </div>
);

export default {
  PageLoader,
  SkeletonLoader,
  TableLoader,
  CardLoader,
  ListItemLoader,
  LoadingButton,
  FormLoader,
  SearchLoader,
  ProgressLoader
};