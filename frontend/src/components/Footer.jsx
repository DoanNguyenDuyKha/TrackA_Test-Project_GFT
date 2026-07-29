import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, Shield, Heart, Mail, ExternalLink, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                A
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">
                Adaptive IELTS Task 2 LMS
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Hệ thống Học tập Thích ứng chuyên biệt cho IELTS Writing Task 2. Tự động nhận diện điểm nghẽn tiêu chí và cá nhân hóa lộ trình thích ứng.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-3">Tính Năng Hệ Thống</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/assignments" className="hover:text-blue-400 transition">Đề Thi Thực Hành Task 2</Link>
              </li>
              <li>
                <Link to="/student/resources" className="hover:text-blue-400 transition">Kho Tài Liệu Thích Ứng</Link>
              </li>
              <li>
                <span className="text-slate-400">Khảo Sát Phân Nhóm Placement Test</span>
              </li>
              <li>
                <span className="text-slate-400">Engine Chấm Điểm Rubric AI</span>
              </li>
            </ul>
          </div>

          {/* Pedagogy Criteria */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-3">4 Tiêu Chí IELTS Writing</h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                <span>Task Response (TR)</span>
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                <span>Coherence & Cohesion (CC)</span>
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2"></span>
                <span>Lexical Resource (LR)</span>
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                <span>Grammatical Accuracy (GRA)</span>
              </li>
            </ul>
          </div>

          {/* Tech & Track Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Thông Tin Dự Án</h4>
            <p className="text-slate-400 leading-relaxed">
              Dự án phát triển Hệ thống Học tập Thích ứng Track A - Chuyên đề IELTS Task 2.
            </p>
            <div className="pt-1 flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                <Sparkles className="w-3 h-3 mr-1 text-blue-400" />
                Adaptive LMS v2.5
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} Adaptive IELTS Writing Task 2 LMS. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              Bảo mật tuyệt đối <Shield className="w-3.5 h-3.5 ml-1 text-emerald-400" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
