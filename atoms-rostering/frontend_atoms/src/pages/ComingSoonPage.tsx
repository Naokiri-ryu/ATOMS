import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';

const ComingSoonPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Tombol Kembali */}
        <button 
          onClick={() => navigate('/home')}
          className="absolute top-6 left-6 flex items-center gap-2 text-navy-700 hover:text-navy-900 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          <span>Kembali ke Home</span>
        </button>

        {/* Ikon Coming Soon */}
        <div className="bg-navy-50 border border-navy-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock size={64} className="text-navy-700" />
        </div>

        {/* Teks Utama */}
        <h1 className="text-3xl font-bold text-navy-900 mb-3">
          Segera Hadir
        </h1>
        <p className="text-slate-600 text-lg mb-8">
          Fitur Statistik sedang dalam tahap pengembangan. Kami akan segera memperbarui informasi ini.
        </p>

        {/* Tombol Aksi */}
        <button
          onClick={() => navigate('/home')}
          className="bg-navy-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-navy-800 transition-colors shadow-md hover:shadow-lg"
        >
          Kembali ke Menu Utama
        </button>
      </div>
    </div>
  );
};

export default ComingSoonPage;