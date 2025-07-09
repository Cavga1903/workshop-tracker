import React, { useState, useEffect, useRef } from 'react';

const FilePreview = ({ fileName, fileUrl, fileType, documentType, children }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  // Check if file is previewable (image only)
  const isPreviewable = () => {
    if (!fileType || !fileName) return false;
    
    const extension = fileName.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    return documentType === 'photo' || 
           fileType.startsWith('image/') ||
           imageExtensions.includes(extension);
  };

  // Handle mouse enter with delay
  const handleMouseEnter = () => {
    if (!isPreviewable()) return;
    
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Set timeout to show preview after 1 second
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPreview(true);
    }, 1000);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    // Clear timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    setShowPreview(false);
    setPreviewLoaded(false);
  };

  // Handle image load
  const handleImageLoad = () => {
    setPreviewLoaded(true);
  };

  // Handle image error
  const handleImageError = () => {
    console.log('Preview image failed to load:', fileName);
    setShowPreview(false);
    setPreviewLoaded(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Debug log
  useEffect(() => {
    if (isPreviewable()) {
      console.log('File is previewable:', fileName, fileType, documentType);
    }
  }, [fileName, fileType, documentType]);

  return (
    <div 
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Original content (file icon) */}
      <div className={`transition-opacity duration-200 ${isPreviewable() ? 'cursor-pointer hover:opacity-80' : ''}`}>
        {children}
      </div>

      {/* Preview tooltip */}
      {showPreview && isPreviewable() && (
        <div className="fixed z-50 pointer-events-none">
          <div 
            className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3"
            style={{
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '8px',
              minWidth: '200px'
            }}
          >
            {/* Preview content */}
            <div className="relative">
              {!previewLoaded && (
                <div className="flex items-center justify-center w-48 h-32 bg-gray-100 dark:bg-gray-700 rounded">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                </div>
              )}
              
              <img
                src={fileUrl}
                alt={fileName}
                className={`max-w-48 max-h-32 object-contain rounded transition-opacity duration-200 ${
                  previewLoaded ? 'opacity-100' : 'opacity-0 absolute'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              
              {/* File name below preview */}
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center truncate">
                {fileName}
              </div>
            </div>
            
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-200 dark:border-t-gray-700"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilePreview; 