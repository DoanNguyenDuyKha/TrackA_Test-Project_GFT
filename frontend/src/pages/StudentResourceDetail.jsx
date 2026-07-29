import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Download, FileText, Sparkles, UserCheck, Clock, ExternalLink } from 'lucide-react';

const StudentResourceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchResourceDetail = async () => {
    try {
      const res = await api.get(`/notifications/my-resources/${id}`);
      if (res.data.success) {
        setResource(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching resource detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResourceDetail();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Đang tải tài liệu...</div>;
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <h2 className="text-lg font-bold text-slate-700">Tài liệu không tồn tại hoặc bạn không có quyền truy cập</h2>
        <button
          onClick={() => navigate('/student/resources')}
          className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md"
        >
          Quay lại Kho Tài Liệu
        </button>
      </div>
    );
  }

  const isPdf = resource.documentUrl && resource.documentUrl.toLowerCase().endsWith('.pdf');
  const isImage = resource.documentUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(resource.documentUrl);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/student/resources')}
            className="flex items-center space-x-2 text-slate-600 hover:text-indigo-600 font-bold text-xs bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay Lại Kho Tài Liệu</span>
          </button>

          {resource.documentUrl && (
            <a
              href={resource.documentUrl}
              download={resource.documentName || 'tai_lieu.pdf'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              <Download className="w-4 h-4" />
              <span>Tải Về Máy Tính</span>
            </a>
          )}
        </div>

        {/* Resource Meta Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <span className="text-xs font-bold text-indigo-600 block mb-1">TÀI LIỆU BỔ TRỢ HỌC TẬP THÍCH ỨNG</span>
              <h1 className="text-2xl font-black text-slate-800">{resource.title}</h1>
            </div>
            <span className="text-xs text-slate-400 font-semibold flex items-center bg-slate-100 px-3 py-1 rounded-xl">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {new Date(resource.createdAt).toLocaleString('vi-VN')}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Lời Nhắn Từ {resource.senderName || 'Giáo Viên'}:</span>
            <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
              {resource.message}
            </p>
          </div>
        </div>

        {/* Dedicated Document Reader Container */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 min-h-[600px] flex flex-col">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-600" />
              Nội Dung Tài Liệu ({resource.documentName || 'File Đính Kèm'})
            </h3>

            {resource.documentUrl && (
              <a
                href={resource.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
              >
                <span>Mở trong Tab Mới</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="flex-1 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center p-2 min-h-[550px]">
            {resource.documentUrl ? (
              isPdf ? (
                <iframe
                  src={resource.documentUrl}
                  title={resource.documentName || 'PDF Viewer'}
                  className="w-full h-full min-h-[550px] rounded-xl border-0"
                ></iframe>
              ) : isImage ? (
                <div className="max-h-[650px] overflow-auto flex items-center justify-center">
                  <img
                    src={resource.documentUrl}
                    alt={resource.documentName}
                    className="max-w-full max-h-[600px] object-contain rounded-xl shadow-md"
                  />
                </div>
              ) : (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(resource.documentUrl)}&embedded=true`}
                  title="Document Viewer"
                  className="w-full h-full min-h-[550px] rounded-xl border-0"
                ></iframe>
              )
            ) : (
              <div className="text-center py-16 space-y-3">
                <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-600">Tài liệu này không đính kèm tệp tệp tin (Chỉ chứa lời nhắn hướng dẫn phía trên)</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentResourceDetail;
