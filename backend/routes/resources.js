const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/resources - Admin lấy danh sách kho tài liệu (có tìm kiếm)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query = {
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { documentName: searchRegex }
        ]
      };
    }

    const resources = await Resource.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: resources
    });
  } catch (error) {
    console.error('GET Admin Resources Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching admin resources', error: error.message });
  }
});

// POST /api/resources - Admin thêm mới tài liệu vào kho
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, documentUrl, documentName, defaultTargetGroup } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const newResource = await Resource.create({
      title,
      description: description || '',
      documentUrl: documentUrl || '',
      documentName: documentName || '',
      defaultTargetGroup: defaultTargetGroup || 'all',
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'Tài liệu đã được thêm vào Kho thành công!',
      data: newResource
    });
  } catch (error) {
    console.error('POST Resource Error:', error);
    return res.status(500).json({ success: false, message: 'Error creating resource', error: error.message });
  }
});

// PUT /api/resources/:id - Admin chỉnh sửa tài liệu trong kho
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const updatedResource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Cập nhật tài liệu trong Kho thành công!',
      data: updatedResource
    });
  } catch (error) {
    console.error('PUT Resource Error:', error);
    return res.status(500).json({ success: false, message: 'Error updating resource', error: error.message });
  }
});

// DELETE /api/resources/:id - Admin xóa tài liệu khỏi kho
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    await Resource.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Đã xóa tài liệu khỏi Kho thành công!'
    });
  } catch (error) {
    console.error('DELETE Resource Error:', error);
    return res.status(500).json({ success: false, message: 'Error deleting resource', error: error.message });
  }
});

// POST /api/resources/:id/send - Admin phát tài liệu từ kho tới học viên (Realtime + Notification DB)
router.post('/:id/send', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const { customMessage, targetGroup, recipientId } = req.body;
    const io = req.app.get('io');
    let createdNotifications = [];

    const sendTitle = resource.title;
    const sendMsg = customMessage || resource.description || 'Giáo viên vừa chia sẻ tài liệu học tập mới cho bạn!';
    const docUrl = resource.documentUrl || '';
    const docName = resource.documentName || '';

    if (recipientId) {
      // Gửi đích danh cho 1 học viên
      const notification = await Notification.create({
        recipientId,
        senderId: req.user._id,
        senderName: req.user.name || 'Admin / Giảng Viên',
        type: 'document_share',
        title: sendTitle,
        message: sendMsg,
        documentUrl: docUrl,
        documentName: docName,
        targetGroup: 'individual'
      });

      createdNotifications.push(notification);

      if (io) {
        io.to(recipientId.toString()).emit('new_notification', notification);
      }
    } else {
      // Gửi theo nhóm học viên
      let userQuery = { role: 'student' };
      const groupToUse = targetGroup || resource.defaultTargetGroup || 'all';

      if (groupToUse && groupToUse !== 'all') {
        userQuery.studentGroup = groupToUse;
      }

      const students = await User.find(userQuery);

      const notifDocs = students.map(student => ({
        recipientId: student._id,
        senderId: req.user._id,
        senderName: req.user.name || 'Admin / Giảng Viên',
        type: 'document_share',
        title: sendTitle,
        message: sendMsg,
        documentUrl: docUrl,
        documentName: docName,
        targetGroup: groupToUse
      }));

      createdNotifications = await Notification.insertMany(notifDocs);

      if (io) {
        students.forEach(student => {
          io.to(student._id.toString()).emit('new_notification', {
            title: sendTitle,
            message: sendMsg,
            documentUrl: docUrl,
            documentName: docName,
            senderName: req.user.name || 'Admin / Giảng Viên',
            createdAt: new Date()
          });
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Đã phát tài liệu thành công tới ${createdNotifications.length} học viên!`,
      count: createdNotifications.length
    });
  } catch (error) {
    console.error('Send Resource From Bank Error:', error);
    return res.status(500).json({ success: false, message: 'Error sending resource from bank', error: error.message });
  }
});

module.exports = router;
