import React, { useState } from 'react';

const SimpleFilePreview = ({ fileName, fileUrl, fileType, documentType, children }) => {
  const [showPreview, setShowPreview] = useState(false);

  // Check if file is previewable (image only)
  const isPreviewable = () => {
    if (!fileType || !fileName) return false;
    
    const extension = fileName.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    return documentType === 'photo' || 
           fileType.startsWith('image/') ||
           imageExtensions.includes(extension);
  };

  if (!isPreviewable()) {
    return <div>{children}</div>;
  }

  return (
    <div className="relative inline-block">
      {/* Original content (file icon) */}
      <div 
        className="cursor-pointer hover:opacity-80 transition-opacity"
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        {children}
      </div>

      {/* Preview tooltip */}
      {showPreview && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="relative">
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-48 max-h-32 object-contain rounded"
              onError={() => console.log('Image failed to load:', fileName)}
            />
            
            {/* File name below preview */}
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center truncate max-w-48">
              {fileName}
            </div>
          </div>
          
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-200 dark:border-t-gray-700"></div>
        </div>
      )}
    </div>
  );
};

export default SimpleFilePreview; 