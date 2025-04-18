import React, { useState } from 'react';
import { Card, Button, Badge, Modal, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import { FaQrcode, FaTrash, FaExternalLinkAlt, FaCopy, FaDownload, FaCheck, FaExclamationTriangle, FaShareAlt } from 'react-icons/fa';
import urlService from '../services/urlService';
import UrlAnalytics from './UrlAnalytics';
import UrlPreview from './UrlPreview';
import ShareModal from './ShareModal';
import { SHORT_URL_BASE } from '../config/config';

/**
 * UrlCard component displays a saved short URL with various actions
 * 
 * @param {Object} props Component props
 * @param {Object} props.url The URL object with details
 * @param {Function} props.onDelete Callback when URL is deleted
 */
const UrlCard = ({ url, onDelete }) => {
  const { id, originalUrl, tag, clickCount, lastAccess } = url;
  const shortUrl = `${SHORT_URL_BASE}/${id}`;
  // Get current environment
  const isProduction = process.env.NODE_ENV === 'production';
  // Display text will be just the ID in production, full URL in development
  const displayText = isProduction ? id : shortUrl;
  
  // State for QR code modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [isQrLoading, setIsQrLoading] = useState(false);
  
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  // State for URL preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  
  // State for share modal
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Format last access time
  const formatLastAccess = (lastAccessStr) => {
    try {
      const date = new Date(lastAccessStr);
      return date.toLocaleString();
    } catch {
      return lastAccessStr;
    }
  };
  
  // State for copy toast notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  
  // Copy link to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setToastMessage('Link copied to clipboard!');
    setToastVariant('success');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000); // Auto hide after 3 seconds
  };
  
  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      await urlService.deleteUrl(id);
      setShowDeleteModal(false);
      
      // Show success toast
      setToastMessage('URL successfully deleted');
      setToastVariant('success');
      setShowToast(true);
      
      if (onDelete) {
        onDelete(id);
      }
    } catch (error) {
      console.error('Error deleting URL:', error);
      setDeleteError('Unable to delete URL. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open QR code modal
  const openQrModal = () => {
    setIsQrLoading(true);
    setShowQrModal(true);
  };

  // Download QR code
  const downloadQrCode = () => {
    const link = document.createElement('a');
    link.href = urlService.getQrCodeUrl(id);
    link.download = `qrcode-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle mouse enter for preview
  const handleMouseEnter = (e) => {
    // Get mouse position relative to viewport
    setPreviewPosition({ 
      x: e.clientX,
      y: e.clientY
    });
    setShowPreview(true);
  };
  
  // Handle mouse move for updating position
  const handleMouseMove = (e) => {
    if (showPreview) {
      // Update position based on current mouse coordinates
      setPreviewPosition({ 
        x: e.clientX,
        y: e.clientY
      });
    }
  };
  
  // Handle mouse leave for preview
  const handleMouseLeave = () => {
    setShowPreview(false);
  };

  return (
    <>
      {/* Toast notification */}
      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} bg={toastVariant} delay={3000} autohide>
          <Toast.Header closeButton={false}>
            {toastVariant === 'success' ? <FaCheck className="me-2" /> : <FaExclamationTriangle className="me-2" />}
            <strong className="me-auto">{toastVariant === 'success' ? 'Success' : 'Error'}</strong>
          </Toast.Header>
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
      
      <Card className="mb-3 shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center bg-light">
          <h5 className="mb-0 text-truncate" style={{ maxWidth: '70%' }}>
            <a 
              href={`http://${shortUrl}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-decoration-none"
              onMouseEnter={handleMouseEnter}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {displayText}
            </a>
            
            {/* URL Preview */}
            <UrlPreview 
              shortId={id} 
              show={showPreview} 
              position={previewPosition} 
            />
          </h5>
          <div>
            {tag && tag !== 'None' && (
              <Badge bg="info" className="me-2">{tag}</Badge>
            )}
            <Badge bg="secondary">Clicks: {clickCount}</Badge>
          </div>
        </Card.Header>
        
        <Card.Body>
          <Card.Title className="text-truncate">
            <a 
              href={originalUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-decoration-none text-dark"
              title={originalUrl}
            >
              {originalUrl}
            </a>
          </Card.Title>
          
          <Card.Text className="text-muted">
            <small>Last accessed: {formatLastAccess(lastAccess)}</small>
          </Card.Text>
          
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              className="me-2"
              onClick={() => copyToClipboard(`http://${shortUrl}`)}
            >
              <FaCopy /> Copy
            </Button>
            
            <Button 
              variant="outline-success" 
              size="sm" 
              className="me-2"
              onClick={() => setShowShareModal(true)}
            >
              <FaShareAlt /> Share
            </Button>
            
            <Button 
              variant="outline-info" 
              size="sm" 
              className="me-2"
              onClick={openQrModal}
            >
              <FaQrcode /> QR Code
            </Button>
            
            {/* Analytics Button - Pass the id which is actually the shortId */}
            <UrlAnalytics urlId={id} />
            
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={() => setShowDeleteModal(true)}
            >
              <FaTrash /> Delete
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* QR Code Modal */}
      <Modal 
        show={showQrModal} 
        onHide={() => setShowQrModal(false)}
        centered
        size="md"
      >
        <Modal.Header closeButton>
          <Modal.Title>QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4">
          <img 
            src={urlService.getQrCodeUrl(id)} 
            alt="QR Code" 
            className="img-fluid" 
            onLoad={() => setIsQrLoading(false)}
            style={{ 
              display: isQrLoading ? 'none' : 'inline-block',
              width: '250px',
              height: '250px'
            }}
          />
          {isQrLoading && (
            <div className="text-center p-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading QR code...</p>
            </div>
          )}
          <p className="mt-3 mb-0 text-muted">
            Scan this code to access: {displayText}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="primary" 
            onClick={downloadQrCode}
          >
            <FaDownload className="me-2" /> Download
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setShowQrModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this short URL? This action cannot be undone.
          
          {deleteError && (
            <div className="alert alert-danger mt-3">{deleteError}</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Share Modal */}
      <ShareModal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        shortId={id}
        shortUrl={`http://${shortUrl}`}
      />
    </>
  );
};

export default UrlCard;