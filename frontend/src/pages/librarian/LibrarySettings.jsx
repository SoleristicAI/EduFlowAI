import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Clock, IndianRupee, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Toast from '../../components/Toast';

const LibrarySettings = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState({ defaultDueDays: 7, finePerDay: 5 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await API.get('/library/settings');
            setSettings(data);
        };
        fetchSettings();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await API.put('/library/settings', settings);
            setMsg('Library rules updated successfully! ⚙️');
        } catch (error) { setMsg('Failed to save settings.'); }
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto">
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative text-center">
                <button onClick={() => navigate(-1)} className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all active:scale-90"><ArrowLeft size={24} /></button>
                <h1 className="text-4xl font-black uppercase tracking-tighter italic flex items-center justify-center gap-3 px-16 leading-tight">Library Rules</h1>
                <p className="text-[14px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2 italic">Configuration Panel</p>
            </div>

            <div className="px-5 -mt-10 relative z-20 max-w-2xl mx-auto">
                <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-lg border border-slate-100">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="p-4 bg-slate-100 text-slate-500 rounded-full"><Settings size={30} className="animate-spin-slow"/></div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Default Loan Duration (Days)</label>
                            <div className="relative flex items-center">
                                <Clock size={20} className="absolute left-5 text-[#42A5F5]" />
                                <input type="number" min="1" required value={settings.defaultDueDays} onChange={(e) => setSettings({...settings, defaultDueDays: e.target.value})} className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-slate-50 border border-slate-200 outline-none focus:border-[#42A5F5] font-black text-[16px] text-slate-800" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Late Fine Per Day (₹)</label>
                            <div className="relative flex items-center">
                                <IndianRupee size={20} className="absolute left-5 text-[#42A5F5]" />
                                <input type="number" min="0" required value={settings.finePerDay} onChange={(e) => setSettings({...settings, finePerDay: e.target.value})} className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-slate-50 border border-slate-200 outline-none focus:border-[#42A5F5] font-black text-[16px] text-slate-800" />
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="w-full mt-8 py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-[14px] shadow-lg transition-all flex justify-center items-center gap-3 active:scale-95">
                            {isSubmitting ? "Saving..." : <>Save Configuration <Save size={20}/></>}
                        </button>
                    </form>
                </div>
            </div>
            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div>
    );
};
export default LibrarySettings;