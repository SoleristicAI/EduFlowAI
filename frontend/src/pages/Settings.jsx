import React from 'react';
import { ArrowLeft, Lock, Bell, Moon, Languages, ShieldAlert, ChevronRight, Sun, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; 

const Settings = () => {
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();

    const appSettings = [
        { 
            title: 'Change password', 
            subtitle: 'Security configurations',
            icon: <Lock size={22}/>, 
            color: 'text-rose-500', 
            bg: 'bg-rose-50', 
            path: '/change-password' 
        },
        { 
            title: 'Notifications',
            subtitle: 'Manage alerts and updates',
            icon: <Bell size={22}/>, 
            color: 'text-yellow-500', 
            bg: 'bg-yellow-50',
        },
        // { 
        //     title: 'Appearance',
        //     subtitle: 'Dark and light mode settings',
        //     icon: isDarkMode ? <Sun size={22}/> : <Moon size={22}/>, 
        //     color: isDarkMode ? 'text-yellow-500' : 'text-slate-700', 
        //     bg: isDarkMode ? 'bg-yellow-50' : 'bg-slate-50',
        //     isTheme: true
        // },
        { 
            title: 'Language',
            subtitle: 'Select your preferred language',
            icon: <Languages size={22}/>,
            color: 'text-blue-500',
            bg: 'bg-blue-50',   
            },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">
            {/* Header Section */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[3.5rem] shadow-lg flex items-center gap-4 relative z-10 overflow-hidden">
                <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
                <button 
                    onClick={() => navigate(-1)} 
                    className="bg-white/20 p-2.5 rounded-xl active:scale-90 border border-white/30 text-white transition-all relative z-10"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black italic tracking-tight capitalize">Settings</h1>
                    <p className="text-[15px] font-bold text-white/80 tracking-widest mt-1 capitalize">System configuration</p>
                </div>
                <div className="absolute right-8 text-white/50"><ShieldCheck size={80}/></div>
            </div>

            {/* Settings List */}
            <div className="px-5 -mt-12 relative z-20 space-y-4">
                {appSettings.map((s, i) => (
                    <div 
                        key={i} 
                        onClick={() => s.path && navigate(s.path)}
                        className="bg-white p-5 rounded-[2.5rem] shadow-md border border-[#DDE3EA] flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group hover:border-[#42A5F5]/30 italic"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            {/* Icon Wrapper */}
                            <div className={`${s.bg} ${s.color} p-4 rounded-[1.5rem] border border-transparent group-hover:scale-105 transition-all duration-500 shrink-0`}>
                                {s.icon}
                            </div>
                            
                            <div className="min-w-0">
                                <span className="font-black text-[16px] text-slate-700 capitalize tracking-tight block truncate group-hover:text-[#42A5F5] transition-colors">
                                    {s.title}
                                </span>
                                <p className="text-[11px] font-bold text-slate-400 capitalize tracking-wide truncate mt-0.5">
                                    {s.subtitle}
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 ml-4">
                            {s.isTheme ? (
                                <div 
                                    onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                                    className="w-14 h-7 rounded-full transition-all duration-500 relative cursor-pointer shadow-inner border border-slate-200"
                                    style={{ backgroundColor: isDarkMode ? '#42A5F5' : '#E2E8F0' }}
                                >
                                    <div 
                                        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-500 flex items-center justify-center" 
                                        style={{ left: isDarkMode ? '32px' : '4px' }}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-[#42A5F5]' : 'bg-slate-300'}`}></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 group-hover:bg-blue-50 transition-colors">
                                    <ChevronRight size={20} className="text-slate-300 group-hover:text-[#42A5F5]" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Version Badge */}
            <div className="mt-12 text-center opacity-30">
                <p className="text-[13px] font-black text-black uppercase tracking-[0.4em]">Protocol v2 • Secure link</p>
            </div>
        </div>
    );
};

export default Settings;