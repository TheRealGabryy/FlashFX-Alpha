import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Loader, Download, RefreshCw } from 'lucide-react';

interface DalleGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (imageUrl: string) => void;
}

const DalleGenerateModal: React.FC<DalleGenerateModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_KEY = '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';

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setGeneratedImage(null);

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate image');
      }

      const data = await response.json();

      if (data.data && data.data[0] && data.data[0].url) {
        setGeneratedImage(data.data[0].url);
      } else {
        throw new Error('No image returned from API');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate image. Please try again.');
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setGeneratedImage(null);
    setError('');
  };

  const handleImport = async () => {
    if (!generatedImage) return;

    try {
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const imageUrl = encodeURIComponent(generatedImage);
      const response = await fetch(proxyUrl + imageUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await response.blob();

      const reader = new FileReader();
      reader.onloadend = () => {
        onImport(reader.result as string);
        onClose();
        setPrompt('');
        setGeneratedImage(null);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Import error:', err);
      setError('Failed to import image. Trying alternative method...');

      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const base64 = canvas.toDataURL('image/png');
            onImport(base64);
            onClose();
            setPrompt('');
            setGeneratedImage(null);
          }
        };
        img.onerror = () => {
          setError('Failed to import image. The image may not be accessible due to CORS restrictions.');
        };
        img.src = generatedImage;
      } catch (fallbackErr) {
        setError('Failed to import image. Please try downloading and uploading manually.');
        console.error('Fallback import error:', fallbackErr);
      }
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-gray-700"
        style={{ zIndex: 1000000 }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Generate with AI</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!generatedImage ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Describe what you want to create
                </label>
                <form onSubmit={handleGenerate}>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., A futuristic city at sunset with flying cars..."
                    className="w-full h-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className="mt-3 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Generate Image</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Tips for better results:</h3>
                <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                  <li>Be specific about style, colors, and mood</li>
                  <li>Describe the composition and perspective</li>
                  <li>Include details about lighting and atmosphere</li>
                  <li>Mention any specific elements or subjects you want</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-600">
                <img
                  src={generatedImage}
                  alt="Generated by DALL-E"
                  className="w-full h-full object-contain bg-gray-900"
                />
              </div>

              <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                <p className="text-sm text-gray-300">
                  <span className="font-medium">Prompt:</span> {prompt}
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {generatedImage && (
          <div className="p-4 border-t border-gray-700 flex justify-end space-x-3">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Import</span>
            </button>
          </div>
        )}

        {loading && (
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center justify-center space-x-2 text-purple-400">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">This may take a moment...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DalleGenerateModal;
