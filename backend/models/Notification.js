const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  senderName: {
    type: String,
    default: 'Hệ Thống LMS'
  },
  type: {
    type: String,
    enum: ['submission_alert', 'document_share', 'system_notice', 'promotion_unlocked'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  documentUrl: {
    type: String // Đường dẫn tài liệu nếu Admin gửi file/link tài liệu
  },
  documentName: {
    type: String
  },
  targetGroup: {
    type: String // Nếu gửi theo nhóm học viên ('all', 'support', 'average', 'excellent')
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);
