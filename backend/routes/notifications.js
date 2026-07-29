const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/notifications - Lấy danh sách thông báo của người dùng hiện tại
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user._id,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    console.error('GET Notifications Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
  }
});

// PUT /api/notifications/read-all - Đánh dấu tất cả thông báo là đã đọc
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Read All Notifications Error:', error);
    return res.status(500).json({ success: false, message: 'Error updating notifications', error: error.message });
  }
});

// POST /api/notifications/send-document - Admin chia sẻ tài liệu/thông báo Realtime cho Học Viên
router.post('/send-document', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, message, documentUrl, documentName, targetGroup, recipientId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const io = req.app.get('io');
    let createdNotifications = [];

    if (recipientId) {
      // Gửi đích danh cho 1 học viên cụ thể
      const notification = await Notification.create({
        recipientId,
        senderId: req.user._id,
        senderName: req.user.name || 'Admin / Giảng Viên',
        type: 'document_share',
        title,
        message,
        documentUrl: documentUrl || '',
        documentName: documentName || '',
        targetGroup: 'individual'
      });

      createdNotifications.push(notification);

      // Realtime socket emit tới học viên cụ thể
      if (io) {
        io.to(recipientId.toString()).emit('new_notification', notification);
      }
    } else {
      // Gửi theo nhóm học viên ('all', 'support', 'average', 'excellent')
      let userQuery = { role: 'student' };
      if (targetGroup && targetGroup !== 'all') {
        userQuery.studentGroup = targetGroup;
      }

      const students = await User.find(userQuery);

      const notifDocs = students.map(student => ({
        recipientId: student._id,
        senderId: req.user._id,
        senderName: req.user.name || 'Admin / Giảng Viên',
        type: 'document_share',
        title,
        message,
        documentUrl: documentUrl || '',
        documentName: documentName || '',
        targetGroup: targetGroup || 'all'
      }));

      createdNotifications = await Notification.insertMany(notifDocs);

      // Broadcast Realtime socket tới toàn bộ hoặc nhóm học viên
      if (io) {
        students.forEach(student => {
          io.to(student._id.toString()).emit('new_notification', {
            title,
            message,
            documentUrl,
            documentName,
            senderName: req.user.name || 'Admin / Giảng Viên',
            createdAt: new Date()
          });
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Đã gửi tài liệu & thông báo Realtime thành công cho ${createdNotifications.length} học viên!`,
      count: createdNotifications.length
    });
  } catch (error) {
    console.error('Send Document Error:', error);
    return res.status(500).json({ success: false, message: 'Error sending document notification', error: error.message });
  }
});

// GET /api/notifications/my-resources - Lấy danh sách kho tài liệu của học viên hiện tại
router.get('/my-resources', authenticateToken, async (req, res) => {
  try {
    const resources = await Notification.find({
      recipientId: req.user._id,
      $or: [
        { documentUrl: { $ne: '' } },
        { documentName: { $ne: '' } }
      ]
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: resources
    });
  } catch (error) {
    console.error('GET My Resources Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching student resources', error: error.message });
  }
});

// GET /api/notifications/my-resources/:id - Lấy chi tiết 1 tài liệu trong kho của học viên
router.get('/my-resources/:id', authenticateToken, async (req, res) => {
  try {
    const resource = await Notification.findOne({
      _id: req.params.id,
      recipientId: req.user._id
    });

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại hoặc không thuộc quyền truy cập' });
    }

    return res.status(200).json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('GET Single Resource Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching resource detail', error: error.message });
  }
});

module.exports = router;

