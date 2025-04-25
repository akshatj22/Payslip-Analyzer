import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useState } from 'react';

export default function FileUpload({ onUploadSuccess }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {'application/pdf': ['.pdf']},
    multiple: false,
    disabled: isUploading,
    onDrop: async (files) => {
      setIsUploading(true);
      setUploadError('');
      const formData = new FormData();
      formData.append('pdf', files[0]);
      
      try {
        const response = await axios.post('http://localhost:5000/upload', formData);
        onUploadSuccess(response.data.filename);
      } catch (error) {
        console.error('Upload failed:', error);
        setUploadError('Upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Payslip Analyzer</h2>
        <p className="text-gray-600 mb-6 text-center">Upload your payslip to get instant answers about your compensation details</p>
        
        <div
          {...getRootProps()}
          className={`p-10 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out cursor-pointer
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
            ${isUploading ? 'opacity-70 cursor-wait' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center">
            <svg 
              className={`w-16 h-16 mb-4 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            
            {isUploading ? (
              <p className="text-center text-gray-600 font-medium">
                Uploading document...
              </p>
            ) : (
              <>
                <p className="text-center text-gray-700 font-medium text-lg">
                  {isDragActive ? 'Drop your PDF here' : 'Drag your payslip PDF here'}
                </p>
                <p className="text-center text-gray-500 mt-2">
                  or <span className="text-blue-500 underline">click to browse</span>
                </p>
                <p className="text-center text-gray-400 text-sm mt-4">
                  Supports PDF format only
                </p>
              </>
            )}
          </div>
        </div>
        
        {uploadError && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-center">
            {uploadError}
          </div>
        )}
        
        <div className="mt-8 text-center">
          <h3 className="text-gray-600 font-medium">Why use Payslip Analyzer?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <svg className="w-8 h-8 text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-gray-700">Instant answers about your pay</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-gray-700">Secure and private analysis</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <svg className="w-8 h-8 text-purple-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-gray-700">Smart insights about your compensation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}