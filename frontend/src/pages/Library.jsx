import React, { useState, useEffect } from 'react';
import { ArrowLeft, Book, Clock, AlertCircle, Bookmark, Search, Zap, Construction, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';

const Library = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const { data } = await API.get(`/library?search=${search}`);
                setBooks(data);
            } catch (err) {
                console.error("Library fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        const delayDebounceFn = setTimeout(() => {
            fetchBooks();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans italic overflow-hidden relative flex flex-col justify-center items-center p-6 text-[15px]">
            
            {/* Top Navigation */}
            <div className="absolute top-10 left-6 z-30">
                <button
                    onClick={() => navigate(-1)}
                    className="bg-white p-3 rounded-2xl active:scale-90 border border-[#DDE3EA] text-[#42A5F5] shadow-md hover:bg-blue-50 transition-all"
                >
                    <ArrowLeft size={24} />
                </button>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-md">
                
                {/* Animated Icon Container */}
                <div className="mb-10 relative">
                    {/* Soft Blue Glow */}
                    <div className="absolute inset-0 bg-[#42A5F5]/10 blur-3xl rounded-full animate-pulse"></div>
                    
                    <div className="bg-white border-2 border-dashed border-[#DDE3EA] p-10 rounded-[3.5rem] shadow-sm relative">
                        <Construction size={80} className="text-[#42A5F5] animate-bounce" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-white p-2 rounded-full shadow-lg border border-blue-50">
                        <Zap size={24} className="text-amber-400 fill-amber-400 animate-pulse" />
                    </div>
                </div>

                {/* Text Section */}
                <h1 className="text-4xl font-black italic tracking-tight text-slate-800 leading-tight mb-4">
                    Module under <br /> <span className="text-[#42A5F5]">construction</span>
                </h1>

                <div className="h-[3px] w-20 bg-[#42A5F5] mx-auto rounded-full mb-8 shadow-sm"></div>

                <p className="text-[16px] text-slate-400 font-bold italic max-w-[320px] leading-relaxed capitalize">
                    Our digital library neural network is being synchronized. <br />
                    <span className="text-[#42A5F5] block mt-2">Estimated deploy: Coming soon</span>
                </p>

                {/* Status Indicator */}
                <div className="mt-12 flex items-center gap-3 bg-white px-8 py-4 rounded-full border border-[#DDE3EA] shadow-sm">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                    <span className="text-[12px] font-black uppercase tracking-widest text-slate-400">
                        System protocol 119: Active
                    </span>
                </div>
            </div>

            {/* Footer Tag */}
            <div className="absolute bottom-10 flex items-center gap-2 opacity-30 text-slate-400">
                <ShieldAlert size={16} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">EduFlowAI security</p>
            </div>
        </div>
    );
};

export default Library;