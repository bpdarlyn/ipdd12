import React, { useState, useEffect } from 'react';
import type { ReportAttachment } from '../../types/index';
import apiService from '../../services/api';
import FileUpload from '../ui/FileUpload';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import './AttachmentsManager.css';

interface AttachmentsManagerProps {
  reportId: number;
  attachments: ReportAttachment[];
  onAttachmentsChange: (attachments: ReportAttachment[]) => void;
  readonly?: boolean;
}

const AttachmentsManager: React.FC<AttachmentsManagerProps> = ({
  reportId,
  attachments,
  onAttachmentsChange,
  readonly = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const handleFileUpload = async (file: File) => {
    try {
      setError('');
      const response = await apiService.uploadAttachment(reportId, file);
      
      // Create new attachment object to add to the list
      const newAttachment: ReportAttachment = {
        id: response.attachment_id,
        report_id: reportId,
        file_name: file.name,
        file_key: response.file_key || `reports/${reportId}/${file.name}`,
        file_size: file.size,
        content_type: file.type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Update the attachments list
      const updatedAttachments = [...attachments, newAttachment];
      onAttachmentsChange(updatedAttachments);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to upload file';
      throw new Error(errorMessage);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      setDeletingIds(prev => new Set(prev).add(attachmentId));
      setError('');
      
      await apiService.deleteAttachment(reportId, attachmentId);
      
      // Remove the attachment from the list
      const updatedAttachments = attachments.filter(a => a.id !== attachmentId);
      onAttachmentsChange(updatedAttachments);
      
    } catch (err: any) {
      setError('Failed to delete attachment');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(attachmentId);
        return newSet;
      });
    }
  };

  const handleDownloadAttachment = async (attachment: ReportAttachment) => {
    try {
      setError('');
      
      // Use the backend download endpoint which will redirect to S3 presigned URL
      const downloadUrl = `${import.meta.env.VITE_API_BASE_URL}/reports/${reportId}/attachments/${attachment.id}/download`;
      
      // Get the auth token for the request
      const token = localStorage.getItem('access_token');
      
      // Create a temporary link with auth header by opening in new tab
      // The backend will handle the redirect to the signed S3 URL
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.style.display = 'none';
      
      // Add auth header by creating a fetch request instead
      fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then(response => {
        if (response.ok) {
          return response.blob();
        }
        throw new Error('Download failed');
      }).then(blob => {
        // Create object URL and download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }).catch(err => {
        setError('Failed to download attachment');
      });
      
    } catch (err: any) {
      setError('Failed to download attachment');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string): string => {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.startsWith('video/')) return '🎥';
    if (contentType.startsWith('audio/')) return '🎵';
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('word') || contentType.includes('document')) return '📝';
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
    if (contentType.includes('powerpoint') || contentType.includes('presentation')) return '📋';
    if (contentType.includes('zip') || contentType.includes('rar')) return '🗜️';
    return '📎';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="attachments-manager">
      <div className="attachments-header">
        <h4>Attachments ({attachments.length})</h4>
      </div>

      {!readonly && (
        <div className="upload-section">
          <FileUpload
            onUpload={handleFileUpload}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
            maxSize={10}
            disabled={loading}
          />
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {attachments.length > 0 && (
        <div className="attachments-list">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="attachment-item">
              <div className="attachment-info">
                <div className="attachment-icon">
                  {getFileIcon(attachment.content_type)}
                </div>
                <div className="attachment-details">
                  <div className="attachment-name" title={attachment.file_name}>
                    {attachment.file_name}
                  </div>
                  <div className="attachment-meta">
                    <span>{formatFileSize(attachment.file_size)}</span>
                    <span>•</span>
                    <span>{attachment.content_type}</span>
                    <span>•</span>
                    <span>Uploaded: {formatDate(attachment.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <div className="attachment-actions">
                <button
                  onClick={() => handleDownloadAttachment(attachment)}
                  className="btn btn-sm btn-outline"
                  title="Download"
                >
                  📥
                </button>
                
                {!readonly && (
                  <button
                    onClick={() => handleDeleteAttachment(attachment.id)}
                    className="btn btn-sm btn-danger"
                    disabled={deletingIds.has(attachment.id)}
                    title="Delete"
                  >
                    {deletingIds.has(attachment.id) ? (
                      <LoadingSpinner size="small" message="" />
                    ) : (
                      '🗑️'
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {attachments.length === 0 && !loading && (
        <div className="no-attachments">
          <p>No attachments uploaded yet.</p>
          {readonly && <p>This report has no attachments.</p>}
        </div>
      )}
    </div>
  );
};

export default AttachmentsManager;