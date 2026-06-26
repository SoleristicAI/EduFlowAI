import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckSquare, BookOpen, Users, FilePlus, CalendarDays,
  ClipboardList, Bot, Activity, Megaphone, MessageCircle, Calendar,
  Layers, Video, BarChart3,
} from 'lucide-react';
import API from '../api';

const TeacherHome = ({ user, searchQuery }) => {
  const navigate = useNavigate();
  const [supportCount, setSupportCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/auth/student-stats');
        setStudentCount(data.totalStudents);

        const { data: supportData } = await API.get('/support/pending-count');
        setSupportCount(supportData.count);
      } catch (err) {
        console.error("Error fetching student stats:", err);
        setStudentCount(120);
      }
    };
    fetchStats();
  }, []);

  const teacherModules = [
    { title: 'Attendance', icon: <CheckSquare size={32} />, path: '/teacher/attendance' },
    { title: 'Schedule', icon: <CalendarDays size={32} />, path: '/timetable' },
    { title: 'Broadcast', icon: <Bot size={32} />, path: '/teacher/notices' },
    { title: 'Support center', icon: <MessageCircle size={32} />, path: '/teacher/support' },
    { title: 'Notice feed', icon: <Megaphone size={32} />, path: '/notice-feed' },
    { title: 'Class list', icon: <Users size={32} />, path: '/teacher/students' },
    { title: 'Assignments', icon: <FilePlus size={32} />, path: '/teacher/assignments' },
    { title: 'Syllabus', icon: <Layers size={32} />, path: '/teacher/upload-syllabus' },
    { title: 'Live class', icon: <Video size={32} />, path: '/teacher/live-class' },
    { title: 'Exam Datesheet', icon: <Calendar size={32} />, path: '/teacher/datesheet', bgColor: 'bg-[#FFF4E5]', iconColor: 'bg-[#FFE0B2] text-[#FB8C00]' },
    { title: 'Exam Results', icon: <BarChart3 size={32} />, path: '/teacher/results', bgColor: 'bg-[#E8F5E9]', iconColor: 'bg-[#C8E6C9] text-[#43A047]' },
    {
      title: 'Academic Calendar',
      icon: <Calendar size={32} />,
      path: '/teacher/calendar',
      bgColor: 'bg-[#E3F2FD]',
      iconColor: 'bg-[#BBDEFB] text-[#1E88E5]'
    }
  ];

  return (
    <div className="px-5 -mt-13 space-y-5 relative z-10 pb-1 font-sans bg-[#F8FAFC] ">
      <div className="px-5  space-y-8 relative z-10 pb-24">

        {/* Main Icon Grid */}
        <div className="grid grid-cols-2 gap-5">
          {teacherModules
            .filter(m => m.title.toLowerCase().includes(searchQuery?.toLowerCase() || ''))
            .map((m, i) => (
              <Link
                to={m.path}
                key={i}
                className="relative bg-white rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 shadow-md border border-[#DDE3EA] active:scale-95 transition-all group hover:border-[#42A5F5] italic"
              >
                {m.title === 'Support center' && supportCount > 0 && (
                  <div className="absolute top-3 right-3 min-w-[24px] h-6 px-2 bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {supportCount}
                  </div>
                )}
                <div className="p-5 rounded-[2rem] bg-blue-50 text-[#42A5F5] transition-all group-hover:bg-[#42A5F5] group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-100">
                  {m.icon}
                </div>
                <span className="font-black text-slate-600 text-[19px] tracking-tight group-hover:text-[#42A5F5] transition-colors capitalize">
                  {m.title}
                </span>
              </Link>
            ))}
        </div>

        {/* Staff Briefing Card */}
        <div className="bg-white border border-[#DDE3EA] rounded-[3rem] p-8 text-slate-800 shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <Activity size={24} className="text-[#42A5F5] animate-pulse" />
              <h3 className="font-black text-2xl tracking-tight capitalize italic text-slate-800">Personnel briefing</h3>
            </div>
            <p className="text-[19px] text-slate-400 font-bold leading-relaxed italic">
              Empowering education, one step at a time.
            </p>
            <button className="mt-8 bg-[#42A5F5] text-white px-10 py-4 rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-90 transition-all italic">
              knowledge
            </button>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-50 rounded-full blur-3xl group-hover:bg-blue-100 transition-all duration-700"></div>
        </div>
      </div>
    </div>
  );
};

export default TeacherHome;