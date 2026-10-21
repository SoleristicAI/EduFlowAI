import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, User, BookOpen, AlertCircle, ArrowRightLeft, BookMarked } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';

const LibraryMembers = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [cardData, setCardData] = useState(null);

    const handleSearch = async (val) => {
        setSearchQuery(val);
        if (val.length < 2) return setSearchResults([]);
        try {
            const { data } = await API.get(`/library/search-students?q=${val}`);
            setSearchResults(data);
        } catch (err) { }
    };

    const fetchMemberCard = async (studentId) => {
        try {
            const { data } = await API.get(`/library/member/${studentId}`);
            setCardData(data);
            setSelectedStudent(data.student);
            setSearchResults([]);
            setSearchQuery('');
        } catch (error) { console.error(error); }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto custom-scrollbar">
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative text-center">
                <button onClick={() => navigate(-1)} className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all active:scale-90"><ArrowLeft size={24} /></button>
                <h1 className="text-4xl font-black uppercase tracking-tighter italic flex items-center justify-center gap-3 px-16 leading-tight">Library Members</h1>
                <p className="text-[14px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2 italic">Digital Identity Cards</p>
            </div>

            <div className="px-5 -mt-10 relative z-20 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Search Panel */}
                <div className="lg:col-span-4 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-50 text-[#42A5F5] rounded-[1.2rem]"><Search size={24}/></div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Search Member</h2>
                    </div>
                    <div className="relative">
                        <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Enter Name or ID..." className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 outline-none focus:border-[#42A5F5] font-bold text-[14px]" />
                        {searchResults.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {searchResults.map(stu => (
                                    <div key={stu._id} onClick={() => fetchMemberCard(stu._id)} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-[#42A5F5] transition-all">
                                        <img src={stu.avatar} className="w-10 h-10 rounded-full object-cover"/>
                                        <div><p className="text-[13px] font-black text-slate-800 uppercase">{stu.name}</p><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stu.enrollmentNo}</p></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Digital Card Panel */}
                <div className="lg:col-span-8">
                    {!cardData ? (
                        <div className="bg-white p-12 rounded-[3rem] text-center border border-slate-100 shadow-sm opacity-50"><User size={60} className="mx-auto text-slate-300 mb-4"/><p className="font-black text-slate-400 uppercase tracking-widest">Search a student to view their Library Card</p></div>
                    ) : (
                        <div className="space-y-6">
                            {/* Card Header */}
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#42A5F5] p-8 rounded-[3rem] shadow-xl text-white flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                                <img src={selectedStudent.avatar} className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover z-10"/>
                                <div className="z-10 text-center md:text-left">
                                    <h2 className="text-3xl font-black uppercase tracking-tighter">{selectedStudent.name}</h2>
                                    <p className="text-[12px] font-black text-blue-100 uppercase tracking-widest mt-1 mb-3">{selectedStudent.enrollmentNo} | Class: {selectedStudent.grade}</p>
                                    <div className="inline-flex bg-white/20 px-4 py-2 rounded-xl text-[11px] font-black tracking-widest uppercase items-center gap-2"><ArrowRightLeft size={14}/> Verified Member</div>
                                </div>
                            </motion.div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white p-5 rounded-[2rem] text-center shadow-sm border border-slate-100">
                                    <BookOpen size={24} className="mx-auto text-[#42A5F5] mb-2"/>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Borrowed</p>
                                    <p className="text-2xl font-black text-slate-800">{cardData.history.length}</p>
                                </div>
                                <div className="bg-white p-5 rounded-[2rem] text-center shadow-sm border border-slate-100">
                                    <BookMarked size={24} className="mx-auto text-emerald-500 mb-2"/>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Returned</p>
                                    <p className="text-2xl font-black text-slate-800">{cardData.history.filter(h=>h.status==='Returned').length}</p>
                                </div>
                                <div className="bg-white p-5 rounded-[2rem] text-center shadow-sm border border-slate-100">
                                    <AlertCircle size={24} className="mx-auto text-rose-500 mb-2"/>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Defaulter Marks</p>
                                    <p className="text-2xl font-black text-slate-800">{cardData.history.filter(h=>h.status==='Overdue').length}</p>
                                </div>
                            </div>

                            {/* History Table */}
                            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-6">Transaction History</h3>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {cardData.history.length === 0 ? <p className="text-slate-400 font-bold text-center py-6">No history found.</p> : 
                                    cardData.history.map(tx => (
                                        <div key={tx._id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                                            <div>
                                                <p className="text-[14px] font-black text-slate-800 uppercase">{tx.bookId?.title}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Issued: {new Date(tx.issueDate).toLocaleDateString('en-GB')}</p>
                                            </div>
                                            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border ${tx.status === 'Returned' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : tx.status === 'Overdue' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-blue-50 text-[#42A5F5] border-blue-100'}`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default LibraryMembers;