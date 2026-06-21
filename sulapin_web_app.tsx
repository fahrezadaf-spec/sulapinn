import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, Moon, Upload, Image as ImageIcon, Sparkles, 
  Layers, Wand2, Trash2, CheckCircle2, AlertCircle, Loader2, Download
} from 'lucide-react';

// --- Utility: Convert File to Base64 ---
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// --- Utility: Exponential Backoff Fetch ---
const fetchWithRetry = async (url, options, maxRetries = 5) => {
  let retries = 0;
  const delays = [1000, 2000, 4000, 8000, 16000];

  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delays[retries - 1]));
    }
  }
};

// --- Main App Component ---
export default function App() {
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('product'); // 'product' | 'combine'

  // Initialize theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-b border-orange-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('product')}>
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-300 rounded-xl">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-400 dark:from-orange-400 dark:to-orange-200">
                Sulapin
              </span>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-orange-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Sistem AI Aktif</span>
               </div>
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-orange-200 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-orange-400" /> : <Moon className="w-5 h-5 text-orange-600" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header/Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Sulap Foto Lu,{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-300">
              Tinggal Upload Aja
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Jangan dipake buat yang aneh aneh woi!!
          </p>
          <div className="mt-5 inline-block">
            <span className="text-white bg-gray-900 dark:bg-gray-800 px-4 py-1.5 rounded-full text-sm font-medium shadow-md border border-gray-800 dark:border-gray-700">
              by Fahreza Ganteng 😎
            </span>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-orange-100 dark:bg-gray-900 p-1 rounded-2xl shadow-inner border border-orange-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('product')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'product' 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-300'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Foto Produk Maker</span>
            </button>
            <button
              onClick={() => setActiveTab('combine')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'combine' 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-300'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span className="hidden sm:inline">Gabungkan Foto</span>
            </button>
          </div>
        </div>

        {/* Render Active Feature */}
        {activeTab === 'product' ? <ProductMakerFeature /> : <CombinePhotosFeature />}

      </main>
    </div>
  );
}

// --- Feature 1: Foto Produk Maker ---
function ProductMakerFeature() {
  const [image, setImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran gambar terlalu besar. Maksimal 5MB.');
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        setImage(base64);
        setError('');
        setResultImage(null);
      } catch (err) {
        setError('Gagal membaca file gambar.');
      }
    }
  };

  const handleAutoPrompt = () => {
    setPrompt("Ubah gambar ini menjadi foto produk profesional. Letakkan objek utama di atas podium marmer putih dengan latar belakang studio berwarna peach pastel netral. Tambahkan pencahayaan sinematik yang lembut dari sudut 45 derajat, bayangan yang realistis, dan beberapa daun monstera blur sebagai properti di latar depan. Kualitas 8k, photorealistic, sangat detail.");
  };

  const handleGenerate = async () => {
    if (!image) {
      setError('Silakan unggah foto produk terlebih dahulu.');
      return;
    }
    if (!prompt.trim()) {
      setError('Silakan masukkan prompt atau instruksi.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const apiKey = ""; // API key is handled by the preview environment
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;

      // Extract base64 data without prefix
      const base64Data = image.split(',')[1];
      const mimeType = image.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];

      const payload = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ["IMAGE"]
        }
      };

      const data = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const generatedBase64 = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      
      if (generatedBase64) {
        setResultImage(`data:image/jpeg;base64,${generatedBase64}`);
      } else {
        throw new Error("Tidak ada gambar yang dihasilkan oleh AI.");
      }

    } catch (err) {
      console.error(err);
      setError(`Gagal membuat gambar: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    setResultImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Editor Section */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border border-orange-100 dark:border-gray-800">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Wand2 className="text-orange-500" /> Pengaturan Editor
        </h2>
        
        {/* Upload Area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Unggah Foto Asli
          </label>
          {!image ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-orange-300 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 bg-orange-50/50 dark:bg-gray-800/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors h-64"
            >
              <Upload className="w-12 h-12 text-orange-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium text-center">
                Klik atau Drag foto Anda ke sini
              </p>
              <p className="text-xs text-gray-500 mt-2">Format yang didukung: JPG, PNG (Maks 5MB)</p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 h-64 bg-gray-100 dark:bg-gray-800 flex items-center justify-center group">
              <img src={image} alt="Original" className="max-h-full max-w-full object-contain" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={removeImage}
                  className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transform hover:scale-105 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/jpeg, image/png, image/webp" 
            className="hidden" 
          />
        </div>

        {/* Prompt Area */}
        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Instruksi / Prompt
            </label>
            <button 
              onClick={handleAutoPrompt}
              className="text-xs flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline"
            >
              <Sparkles className="w-3 h-3" /> Auto Prompt
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Contoh: Ubah menjadi foto produk profesional dengan latar belakang studio minimalis..."
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none h-32 transition-all"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-xl flex items-start gap-2 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !image || !prompt}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Menyulap Foto...
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              Sulap Sekarang
            </>
          )}
        </button>
      </div>

      {/* Result Section */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border border-orange-100 dark:border-gray-800 flex flex-col">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ImageIcon className="text-orange-500" /> Hasil Sulapan
        </h2>
        
        <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 relative overflow-hidden min-h-[400px]">
          {isGenerating ? (
            <div className="flex flex-col items-center text-orange-500 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="font-medium animate-pulse">AI sedang melukis keajaiban...</p>
            </div>
          ) : resultImage ? (
            <div className="relative w-full h-full group flex items-center justify-center bg-black/5 dark:bg-black/20 p-2">
               <img 
                src={resultImage} 
                alt="AI Generated Result" 
                className="max-w-full max-h-[600px] object-contain rounded-xl shadow-md"
              />
               <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a 
                    href={resultImage} 
                    download="sulapin-product-result.jpg"
                    className="bg-white/90 text-gray-900 p-3 rounded-full shadow-lg hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-2"
                    title="Unduh Hasil"
                  >
                    <Download className="w-5 h-5" />
                  </a>
               </div>
            </div>
          ) : (
             <div className="text-center text-gray-400 dark:text-gray-500 p-6">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Hasil sulapan akan muncul di sini.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Feature 2: Gabungkan Foto ---
function CombinePhotosFeature() {
  const [images, setImages] = useState([]); // Array of base64 strings
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 4) {
      setError('Maksimal hanya 4 foto yang bisa diunggah.');
      return;
    }

    setError('');
    
    try {
      const newBase64Images = [];
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          setError(`File ${file.name} terlalu besar (Maks 5MB).`);
          continue;
        }
        const base64 = await fileToBase64(file);
        newBase64Images.push(base64);
      }
      setImages(prev => [...prev, ...newBase64Images].slice(0, 4));
      setResultImage(null);
    } catch (err) {
      setError('Gagal membaca file gambar.');
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setResultImage(null);
  };

  const handleGenerate = async () => {
    if (images.length < 2) {
      setError('Silakan unggah minimal 2 foto untuk digabungkan.');
      return;
    }
    if (!prompt.trim()) {
      setError('Silakan tulis instruksi penggabungan.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const apiKey = ""; // API key handled by environment
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;

      const parts = [{ text: prompt }];
      
      images.forEach(img => {
        const base64Data = img.split(',')[1];
        const mimeType = img.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      });

      const payload = {
        contents: [{ parts: parts }],
        generationConfig: {
          responseModalities: ["IMAGE"]
        }
      };

      const data = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const generatedBase64 = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      
      if (generatedBase64) {
        setResultImage(`data:image/jpeg;base64,${generatedBase64}`);
      } else {
        throw new Error("Tidak ada gambar yang dihasilkan oleh AI.");
      }

    } catch (err) {
      console.error(err);
      setError(`Gagal menggabungkan gambar: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Editor Section */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border border-orange-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-bold flex items-center gap-2">
             <Layers className="text-orange-500" /> Penggabung AI
           </h2>
           <span className="text-sm font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400 px-3 py-1 rounded-full">
             {images.length} / 4 Foto
           </span>
        </div>
        
        {/* Upload Area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Unggah 2-4 Foto
          </label>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
             {images.map((img, index) => (
                <div key={index} className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-32 bg-gray-100 dark:bg-gray-800 group">
                   <img src={img} alt={`Upload ${index+1}`} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button 
                       onClick={() => removeImage(index)}
                       className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                </div>
             ))}
             {images.length < 4 && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-orange-300 dark:border-gray-700 hover:border-orange-500 bg-orange-50/50 dark:bg-gray-800/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors h-32"
                >
                  <Upload className="w-6 h-6 text-orange-400 mb-2" />
                  <span className="text-xs text-gray-500 font-medium">Tambah Foto</span>
                </div>
             )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/jpeg, image/png, image/webp" 
            multiple
            className="hidden" 
          />
        </div>

        {/* Prompt Area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Instruksi Penggabungan
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Contoh: Gabungkan wajah orang dari foto pertama dengan pakaian dan latar belakang dari foto kedua. Buat gayanya menjadi lukisan cat air."
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none h-32 transition-all"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-xl flex items-start gap-2 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || images.length < 2 || !prompt}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Menyatukan Gambar...
            </>
          ) : (
            <>
              <Wand2 className="w-6 h-6" />
              Gabungkan Sekarang
            </>
          )}
        </button>
      </div>

      {/* Result Section */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border border-orange-100 dark:border-gray-800 flex flex-col">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Sparkles className="text-orange-500" /> Karya Baru
        </h2>
        
        <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 relative overflow-hidden min-h-[400px]">
          {isGenerating ? (
            <div className="flex flex-col items-center text-orange-500 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="font-medium animate-pulse">Menghasilkan karya unik...</p>
            </div>
          ) : resultImage ? (
            <div className="relative w-full h-full group flex items-center justify-center bg-black/5 dark:bg-black/20 p-2">
               <img 
                src={resultImage} 
                alt="AI Combined Result" 
                className="max-w-full max-h-[600px] object-contain rounded-xl shadow-md"
              />
               <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a 
                    href={resultImage} 
                    download="sulapin-combined-result.jpg"
                    className="bg-white/90 text-gray-900 p-3 rounded-full shadow-lg hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-2"
                    title="Unduh Hasil"
                  >
                    <Download className="w-5 h-5" />
                  </a>
               </div>
            </div>
          ) : (
             <div className="text-center text-gray-400 dark:text-gray-500 p-6">
                <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Karya gabungan Anda akan muncul di sini.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}