
import React, { useState, ChangeEvent } from 'react';
import { IconClose, IconUpload } from './Icon';
import { uploadFile, generateFileName } from '../lib/storage';
import { useTranslation } from '../hooks/useTranslation';

interface PaymentProofModalProps {
  onUpload: (url: string) => void;
  onClose: () => void;
}

const PaymentProofModal: React.FC<PaymentProofModalProps> = ({ onUpload, onClose }) => {
  const t = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const fileName = generateFileName(file.name);
      const url = await uploadFile('payments', fileName, file);
      onUpload(url);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Failed to upload payment proof. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-xl font-bold">{t.uploadProof}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <IconClose className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t.bankTransferInstructions}
          </p>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Receipt / Screenshot
            </label>
            <label htmlFor="proof-upload" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-lg font-bold text-brand-600 hover:text-brand-500 border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 flex flex-col items-center justify-center shadow-sm transition-all hover:border-brand-300">
              <IconUpload className="w-10 h-10 mb-2 text-gray-400" />
              <span className="text-sm">{file ? file.name : 'Click to select file'}</span>
              <input id="proof-upload" name="proof-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,.pdf" />
            </label>
          </div>
          
          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
        </div>
        
        <div className="p-6 border-t dark:border-gray-800 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isUploading || !file}
            className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Submit Proof'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentProofModal;
