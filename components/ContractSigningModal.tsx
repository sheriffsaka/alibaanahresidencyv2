
import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { IconClose } from './Icon';

interface ContractSigningModalProps {
  contractText: string;
  onSign: (signatureData: string) => void;
  onClose: () => void;
}

const ContractSigningModal: React.FC<ContractSigningModalProps> = ({ contractText, onSign, onClose }) => {
  const t = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasSigned(true);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setHasSigned(false);
    }
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (canvas && hasSigned) {
      onSign(canvas.toDataURL());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t.contractTitle}</h2>
            <p className="text-sm text-gray-500">{t.contractSubtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <IconClose className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-950">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border dark:border-gray-800 prose dark:prose-invert max-w-none whitespace-pre-wrap font-serif text-lg leading-relaxed">
            {contractText}
          </div>
        </div>

        <div className="p-8 border-t dark:border-gray-800 bg-white dark:bg-gray-900">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">{t.signContract}</label>
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-950 cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasSigned && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 dark:text-gray-600 font-medium italic">
                {t.signaturePlaceholder}
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={clearSignature}
              className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
            >
              {t.clearSignature}
            </button>
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!hasSigned}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all transform hover:-translate-y-1 active:scale-95"
              >
                {t.submitSignature}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractSigningModal;
