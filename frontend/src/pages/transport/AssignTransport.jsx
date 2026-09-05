import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Map, Users, CheckCircle, Save, X, Navigation, ArrowLeft, MapPin, IndianRupee, SearchX, ChevronRight, RefreshCw, AlertCircle, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const AssignTransport = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); 
    const [routes, setRoutes] = useState([]);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedClass, setSelectedClass] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    const [pendingAssignments, setPendingAssignments] = useState({});
    
    // 🔥 PERSISTENT STATES (Local Storage se hamesha yaad rakhega) 🔥
    const [completedRoutes, setCompletedRoutes] = useState(() => {
        const saved = localStorage.getItem('transport_completed_routes');
        return saved ? JSON.parse(saved) : [];
    });
    const [completedClasses, setCompletedClasses] = useState(() => {
        const saved = localStorage.getItem('transport_completed_classes');
        return saved ? JSON.parse(saved) : {}; 
    });
    
    const [activeStudent, setActiveStudent] = useState(null); 
    const [selectedStop, setSelectedStop] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showRouteConfirm, setShowRouteConfirm] = useState(false); 
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        localStorage.setItem('transport_completed_routes', JSON.stringify(completedRoutes));
    }, [completedRoutes]);

    useEffect(() => {
        localStorage.setItem('transport_completed_classes', JSON.stringify(completedClasses));
    }, [completedClasses]);

    useEffect(() => {
        fetchRoutes();
        fetchClasses();
    }, []);

    useEffect(() => {
        if (step === 3 && selectedClass) {
            fetchStudents();
        }
    }, [step, selectedClass]);

    const fetchRoutes = async () => {
        try {
            const res = await api.get('/transport/routes');
            setRoutes(res.data);
        } catch (error) { console.error(error); }
    };

    const sortGrades = (gradesList) => {
        const getVal = (g) => {
            const str = String(g).toUpperCase().trim();
            if (str.includes('NUR')) return -3;
            if (str.includes('LKG')) return -2;
            if (str.includes('UKG')) return -1;
            if (str.includes('PREP')) return 0;
            const match = str.match(/\d+/);
            if (match) return parseInt(match[0], 10);
            return 999;
        };
        return [...gradesList].sort((a, b) => getVal(a) - getVal(b));
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get('/users/grades/all'); 
            setClasses(sortGrades(res.data)); 
        } catch (error) { console.error(error); }
    };

    const fetchStudents = async () => {
        setIsLoadingStudents(true);
        setStudents([]); 
        try {
            const res = await api.get(`/users/students/${encodeURIComponent(selectedClass)}`);
            setStudents(res.data);
        } catch (error) { 
            console.error("Failed to fetch students:", error); 
        } finally {
            setIsLoadingStudents(false);
        }
    };

    const handleGlobalUpdate = async () => {
        const assignmentArray = Object.keys(pendingAssignments).map(studentId => ({
            studentId,
            stopName: pendingAssignments[studentId].stopName,
            stopPrice: pendingAssignments[studentId].price
        }));

        if (assignmentArray.length === 0) return alert("No new changes to save!");

        setIsUpdating(true);
        try {
            await api.put('/transport/assign-students', {
                routeId: selectedRoute._id,
                assignments: assignmentArray
            });
            
            setCompletedClasses(prev => {
                const currentRouteClasses = prev[selectedRoute._id] || [];
                return {
                    ...prev,
                    [selectedRoute._id]: [...new Set([...currentRouteClasses, selectedClass])]
                };
            });
            
            setPendingAssignments({});
            setSearchQuery('');
            setStep(2); 
            
        } catch (error) {
            alert("Failed to save details.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleFinalizeRoute = () => {
        setCompletedRoutes(prev => [...new Set([...prev, selectedRoute._id])]);
        setShowRouteConfirm(false);
        setSearchQuery('');
        setSelectedClass('');
        setSelectedRoute(null);
        setStep(1); 
    };

    const filteredList = (list, key) => list.filter(item => {
        if (!item) return false;
        const val = key ? item[key] : item;
        return val ? val.toString().toLowerCase().includes(searchQuery.toLowerCase()) : false;
    });

    const handleNextStep = () => {
        if (step === 1 && selectedRoute) setStep(2);
        if (step === 2 && selectedClass) setStep(3);
        setSearchQuery('');
    };

    const EmptySearchState = ({ type }) => (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-blue-50 text-[#42A5F5] rounded-full flex items-center justify-center mb-6 shadow-inner">
                <SearchX size={40} className="animate-pulse" />
            </div>
            <h3 className="text-xl font-black tracking-wide text-slate-800">No {type} Found</h3>
            <p className="text-[12px] font-bold text-slate-400 tracking-widest mt-2 uppercase">
                We couldn't find anything matching "{searchQuery}"
            </p>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-40 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto custom-scrollbar">
            
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-32 rounded-b-[4rem] shadow-xl relative overflow-visible text-center">
                <button onClick={() => navigate(-1)} className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all hover:bg-white/30 active:scale-90 shadow-sm backdrop-blur-md">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-black tracking-wide italic px-16">Setup Transport</h1>
                <p className="text-[13px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2 italic">Add Students to Buses</p>
            </div>

            <div className="px-5 -mt-20 relative z-20 max-w-5xl mx-auto space-y-6">
                
                {/* 🔥 HEADER & DONE ROUTE BUTTON AT TOP NOW 🔥 */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
                    <div>
                        <h2 className="text-[22px] font-extrabold text-slate-800 tracking-wide capitalize">
                            {step === 1 ? 'Select a bus route' : step === 2 ? 'Choose a class' : 'Select bus stop for students'}
                        </h2>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1.5">
                            {step === 1 ? 'Choose an active route from the list' : step === 2 ? `Selected Route: ${selectedRoute?.routeName || ''}` : `Class: ${selectedClass} • Route: ${selectedRoute?.routeName || ''}`}
                        </p>
                    </div>
                    
                    {/* 👇 YEH BUTTON AB UPAR AA GAYA HAI TAQKI NEECHE BLOCK NA HO 👇 */}
                    {step === 2 && (completedClasses[selectedRoute?._id] || []).length > 0 && (
                        <button onClick={() => setShowRouteConfirm(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-[11px] shadow-md shadow-emerald-500/30 transition-all active:scale-95 shrink-0">
                            Done with this Route <CheckSquare size={16} />
                        </button>
                    )}
                </div>

                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder={`Search ${step === 1 ? 'routes' : step === 2 ? 'classes' : 'students'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-[2rem] py-4 pl-14 pr-6 font-bold text-[14px] text-slate-700 outline-none focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    />
                </div>

                {/* ================= ROUTES ================= */}
                {step === 1 && (
                    filteredList(routes, 'routeName').length === 0 ? <EmptySearchState type="Routes" /> :
                    <div className="space-y-4">
                        {filteredList(routes, 'routeName').map((route, i) => {
                            const isRouteCompleted = completedRoutes.includes(route._id);
                            return (
                            <motion.div 
                                 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}
                                 key={route._id} onClick={() => setSelectedRoute(route)}
                                 className={`p-6 bg-white border-2 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-colors ${selectedRoute?._id === route._id ? 'border-[#42A5F5] bg-blue-50 shadow-md' : isRouteCompleted ? 'border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50' : 'border-slate-100 hover:border-blue-200'}`}>
                                <div className="flex items-center gap-5">
                                    <div className={`p-4 rounded-[1.5rem] transition-colors ${selectedRoute?._id === route._id ? 'bg-[#42A5F5] text-white shadow-lg shadow-blue-500/30' : isRouteCompleted ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-50 text-slate-400'}`}>
                                        <Map size={24} />
                                    </div>
                                    <div>
                                        <h3 className={`font-black text-xl tracking-wide capitalize ${isRouteCompleted && selectedRoute?._id !== route._id ? 'text-emerald-700' : 'text-slate-800'}`}>{route.routeName}</h3>
                                        <p className={`text-[11px] font-bold uppercase tracking-widest mt-1 ${isRouteCompleted && selectedRoute?._id !== route._id ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            {isRouteCompleted ? 'Setup Done' : `Total Stops: ${route.stops?.length || 0}`}
                                        </p>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedRoute?._id === route._id ? 'border-[#42A5F5] bg-[#42A5F5]' : isRouteCompleted ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                                    {(selectedRoute?._id === route._id || isRouteCompleted) && <CheckCircle size={14} className="text-white" />}
                                </div>
                            </motion.div>
                        )})}
                    </div>
                )}

                {/* ================= CLASSES ================= */}
                {step === 2 && (
                    filteredList(classes, null).length === 0 ? <EmptySearchState type="Classes" /> :
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {filteredList(classes, null).map((cls, i) => {
                            const isCompletedClass = (completedClasses[selectedRoute?._id] || []).includes(cls);
                            return (
                            <motion.div 
                                 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}
                                 key={cls} onClick={() => setSelectedClass(cls)}
                                 className={`relative p-6 border-2 rounded-[2rem] text-center cursor-pointer transition-colors ${selectedClass === cls ? 'border-[#42A5F5] bg-blue-50 shadow-md' : isCompletedClass ? 'border-emerald-400 bg-emerald-50' : 'bg-white border-slate-100 hover:border-blue-200'}`}>
                                {isCompletedClass && (
                                    <div className="absolute top-4 right-4 text-emerald-500 bg-white rounded-full"><CheckCircle size={20} /></div>
                                )}
                                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-colors ${selectedClass === cls ? 'bg-[#42A5F5] text-white shadow-lg shadow-blue-500/30' : isCompletedClass ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                    <Users size={28} />
                                </div>
                                <h3 className={`font-black text-2xl tracking-wide uppercase ${isCompletedClass ? 'text-emerald-700' : 'text-slate-800'}`}>{cls}</h3>
                            </motion.div>
                        )})}
                    </div>
                )}

                {/* ================= STUDENTS ================= */}
                {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <button onClick={() => { setStep(2); setSearchQuery(''); setPendingAssignments({}); }} className="text-slate-400 font-black uppercase text-[11px] mb-2 hover:text-[#42A5F5] flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 w-max transition-all active:scale-95 tracking-widest">
                            <ArrowLeft size={16} /> Back to Classes
                        </button>
                        
                        {isLoadingStudents ? (
                            <div className="flex flex-col items-center py-20">
                                <RefreshCw className="animate-spin text-[#42A5F5] mb-4" size={40} />
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[12px]">Fetching Students...</p>
                            </div>
                        ) : filteredList(students, 'name').length === 0 ? (
                            <EmptySearchState type="Students" /> 
                        ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-20">
                            {filteredList(students, 'name').map((student, i) => {
                                const pending = pendingAssignments[student._id];
                                const existing = student.transportRoute; 
                                const isAssignedToThisBus = existing && existing._id === selectedRoute._id;

                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}
                                        key={student._id} className={`p-6 bg-white border-2 rounded-[2rem] flex items-center justify-between transition-all group ${pending ? 'border-emerald-400 shadow-md bg-emerald-50/30' : existing ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 hover:border-blue-200'}`}>
                                        <div className="flex-1 overflow-hidden pr-4">
                                            <h3 className="font-black text-lg tracking-wide text-slate-800 capitalize truncate">{student.name}</h3>
                                            
                                            {pending ? (
                                                <span className="mt-2 text-[10px] font-black text-emerald-600 bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 uppercase tracking-widest">
                                                    <CheckCircle size={12} /> Ready to save: {pending.stopName}
                                                </span>
                                            ) : existing ? (
                                                <span className={`mt-2 text-[10px] font-black px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 uppercase tracking-widest ${isAssignedToThisBus ? 'text-blue-600 bg-blue-100 border-blue-200' : 'text-amber-600 bg-amber-100 border-amber-200'}`}>
                                                    <AlertCircle size={12} /> 
                                                    {isAssignedToThisBus ? `Already in this bus: ${student.transportStop?.stopName}` : `In ${existing.routeName}: ${student.transportStop?.stopName}`}
                                                </span>
                                            ) : (
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 truncate">
                                                    <MapPin size={12} className="inline mr-1" /> {student.address?.fullAddress || 'No Address'}
                                                </p>
                                            )}
                                        </div>

                                        <button onClick={() => { setActiveStudent(student); setSelectedStop(null); setShowConfirm(false); }} 
                                             className={`shrink-0 px-4 h-12 rounded-[1.2rem] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-90 font-black uppercase text-[10px] tracking-widest ${pending ? 'bg-emerald-500 text-white shadow-md' : existing ? 'bg-amber-100 text-amber-600 border border-amber-200 hover:bg-amber-500 hover:text-white' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-[#42A5F5] hover:text-white'}`}>
                                            {pending ? 'Added' : existing ? <><RefreshCw size={14} /> Change</> : <><Navigation size={14} /> Add to Bus</>}
                                        </button>
                                    </motion.div>
                                )
                            })}
                        </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* 🔥 FLOATING ACTION BUTTON (NEXT) 🔥 */}
            <AnimatePresence>
                {((step === 1 && selectedRoute) || (step === 2 && selectedClass)) && (
                    <motion.div initial={{ y: 150, opacity: 0, x: '-50%' }} animate={{ y: 0, opacity: 1, x: '-50%' }} exit={{ y: 150, opacity: 0, x: '-50%' }} className="fixed bottom-8 left-1/2 z-40">
                        <button onClick={handleNextStep} className="bg-slate-900 text-white px-8 py-5 rounded-full font-black uppercase tracking-widest text-[13px] shadow-[0_20px_40px_rgba(15,23,42,0.4)] flex items-center gap-3 hover:scale-105 active:scale-95 transition-all group">
                            Continue to {step === 1 ? 'Classes' : 'Students'}
                            <div className="bg-white/20 p-1.5 rounded-full group-hover:bg-[#42A5F5] transition-colors"><ChevronRight size={18} /></div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🔥 UPDATE BUTTON FIXED AT BOTTOM OF STEP 3 🔥 */}
            <AnimatePresence>
                {step === 3 && Object.keys(pendingAssignments).length > 0 && (
                    <motion.div initial={{ y: 150, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 150, opacity: 0 }} className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 p-6 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
                        <div>
                            <p className="font-black text-slate-800 tracking-wide text-lg">{Object.keys(pendingAssignments).length} Students Selected</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Don't forget to save!</p>
                        </div>
                        <button onClick={handleGlobalUpdate} disabled={isUpdating} className="flex items-center gap-2 bg-[#42A5F5] hover:bg-blue-600 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[13px] shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                            {isUpdating ? 'Saving...' : 'Save & Go Back'} <Save size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ================= MODAL: SELECT STOP ================= */}
            <AnimatePresence>
                {activeStudent && !showConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveStudent(null)} />
                        
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[3rem] w-full max-w-md p-8 shadow-2xl z-10">
                            <button onClick={() => setActiveStudent(null)} className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={24} /></button>
                            
                            <h2 className="text-2xl font-black tracking-wide mb-1 text-slate-800 capitalize">Select Bus Stop</h2>
                            <p className="text-[12px] font-bold text-[#42A5F5] uppercase tracking-widest mb-6">For: {activeStudent.name}</p>

                            <div className="max-h-72 overflow-y-auto space-y-3 pr-2 mb-6 custom-scrollbar">
                                {selectedRoute.stops.map((stop, i) => (
                                    <div key={i} onClick={() => setSelectedStop(stop)} className={`p-5 rounded-[1.5rem] border-2 cursor-pointer flex justify-between items-center transition-all ${selectedStop?.stopName === stop.stopName ? 'border-[#42A5F5] bg-blue-50 shadow-sm' : 'border-slate-100 hover:border-blue-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedStop?.stopName === stop.stopName ? 'border-[#42A5F5]' : 'border-slate-300'}`}>
                                                {selectedStop?.stopName === stop.stopName && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 bg-[#42A5F5] rounded-full" />}
                                            </div>
                                            <span className={`font-black uppercase text-[13px] tracking-widest ${selectedStop?.stopName === stop.stopName ? 'text-[#42A5F5]' : 'text-slate-700'}`}>{stop.stopName}</span>
                                        </div>
                                        <span className="font-black text-slate-500 flex items-center"><IndianRupee size={14} className="mr-0.5" />{stop.monthlyPrice || stop.monthlyFee || 0}</span>
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => { if(selectedStop) setShowConfirm(true); else alert('Please select a stop first!'); }} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[13px] shadow-lg transition-all active:scale-95">
                                Continue
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ================= MODAL: CONFIRM STUDENT STOP ASSIGNMENT ================= */}
            <AnimatePresence>
                {showConfirm && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
                        
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[3rem] w-full max-w-sm p-8 shadow-2xl z-10 text-center">
                            
                            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200 }} className="w-24 h-24 bg-blue-50 text-[#42A5F5] rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                                <CheckCircle size={48} />
                            </motion.div>
                            
                            <h2 className="text-2xl font-black tracking-wide mb-2 text-slate-800 capitalize">Are you sure?</h2>
                            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-8 leading-relaxed">
                                Add <span className="text-slate-800 font-black">{activeStudent.name}</span> to <span className="text-[#42A5F5] font-black">{selectedStop.stopName}</span>?
                            </p>
                            
                            <div className="flex gap-4">
                                <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest text-[12px] hover:bg-slate-200 transition-colors active:scale-95">Cancel</button>
                                <button onClick={() => {
                                    setPendingAssignments(prev => ({
                                        ...prev,
                                        [activeStudent._id]: { stopName: selectedStop.stopName, price: selectedStop.monthlyPrice || selectedStop.monthlyFee || 0 }
                                    }));
                                    setActiveStudent(null);
                                    setShowConfirm(false);
                                }} className="flex-1 py-4 bg-[#42A5F5] text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[12px] hover:bg-blue-600 shadow-lg shadow-blue-500/30 transition-all active:scale-95">Yes, Add</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ================= MODAL: CONFIRM ROUTE FINALIZATION ================= */}
            <AnimatePresence>
                {showRouteConfirm && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRouteConfirm(false)} />
                        
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[3rem] w-full max-w-sm p-8 shadow-2xl z-10 text-center">
                            
                            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200 }} className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                                <CheckSquare size={48} />
                            </motion.div>
                            
                            <h2 className="text-2xl font-black tracking-wide mb-2 text-slate-800 capitalize">Done with this Route?</h2>
                            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-8 leading-relaxed">
                                Are you sure you have added all students to <span className="text-emerald-500 font-black">{selectedRoute?.routeName}</span>?
                            </p>
                            
                            <div className="flex gap-4">
                                <button onClick={() => setShowRouteConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest text-[12px] hover:bg-slate-200 transition-colors active:scale-95">No</button>
                                <button onClick={handleFinalizeRoute} className="flex-1 py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[12px] hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all active:scale-95">Yes, I'm Done</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default AssignTransport;