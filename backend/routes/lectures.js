const express = require('express');
const router = express.Router();
const Lecture = require('../models/Lecture');
const Exercise = require('../models/Exercise');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/lectures
// - Dynamic Adaptive Filtering for Students (automatically returns lectures matching studentGroup)
// - Includes attached exercises for each lecture
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      // Tự động trả về bài học thích ứng theo nhóm năng lực của học viên
      query.targetGroup = req.user.studentGroup;
    } else if (req.query.targetGroup) {
      query.targetGroup = req.query.targetGroup;
    }

    if (req.query.focusCriterion) {
      query.focusCriterion = req.query.focusCriterion;
    }

    const lectures = await Lecture.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Đính kèm danh sách Bài tập nhỏ tương tác tương ứng cho từng Bài giảng
    const lectureIds = lectures.map(l => l._id);
    const exercises = await Exercise.find({ lectureId: { $in: lectureIds } });

    const lecturesWithExercises = lectures.map(lecture => {
      const lectureObj = lecture.toObject();
      lectureObj.exercises = exercises.filter(ex => ex.lectureId.toString() === lecture._id.toString());
      return lectureObj;
    });

    return res.status(200).json({
      success: true,
      count: lecturesWithExercises.length,
      data: lecturesWithExercises
    });
  } catch (error) {
    console.error('GET Lectures Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching lectures', error: error.message });
  }
});

// GET /api/lectures/:id - Chi tiết 1 bài giảng kèm bài tập đính kèm
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id).populate('createdBy', 'name email');
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }

    const exercises = await Exercise.find({ lectureId: lecture._id });

    const data = lecture.toObject();
    data.exercises = exercises;

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('GET Single Lecture Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching lecture', error: error.message });
  }
});

// POST /api/lectures - Admin tạo Bài giảng mới
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, content, focusCriterion, targetGroup } = req.body;

    if (!title || !content || !focusCriterion || !targetGroup) {
      return res.status(400).json({ success: false, message: 'Please provide title, content, focusCriterion, targetGroup' });
    }

    const newLecture = await Lecture.create({
      title,
      content,
      focusCriterion,
      targetGroup,
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'Lecture created successfully',
      data: newLecture
    });
  } catch (error) {
    console.error('POST Lecture Error:', error);
    return res.status(500).json({ success: false, message: 'Error creating lecture', error: error.message });
  }
});

// PUT /api/lectures/:id - Admin cập nhật Bài giảng
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }

    const updatedLecture = await Lecture.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Lecture updated successfully',
      data: updatedLecture
    });
  } catch (error) {
    console.error('PUT Lecture Error:', error);
    return res.status(500).json({ success: false, message: 'Error updating lecture', error: error.message });
  }
});

// DELETE /api/lectures/:id - Admin xóa Bài giảng (và các bài tập liên quan)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }

    await Promise.all([
      Lecture.findByIdAndDelete(req.params.id),
      Exercise.deleteMany({ lectureId: req.params.id })
    ]);

    return res.status(200).json({
      success: true,
      message: 'Lecture and associated exercises deleted successfully'
    });
  } catch (error) {
    console.error('DELETE Lecture Error:', error);
    return res.status(500).json({ success: false, message: 'Error deleting lecture', error: error.message });
  }
});

// --- EXERCISE MANAGEMENT ROUTES FOR ADMIN ---

// POST /api/lectures/:lectureId/exercises - Admin tạo Bài tập đính kèm bài giảng
router.post('/:lectureId/exercises', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, type, questions } = req.body;
    const { lectureId } = req.params;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Parent Lecture not found' });
    }

    if (!title || !type) {
      return res.status(400).json({ success: false, message: 'Please provide exercise title and type' });
    }

    const newExercise = await Exercise.create({
      lectureId,
      title,
      type,
      questions: questions || []
    });

    return res.status(201).json({
      success: true,
      message: 'Exercise created successfully',
      data: newExercise
    });
  } catch (error) {
    console.error('POST Exercise Error:', error);
    return res.status(500).json({ success: false, message: 'Error creating exercise', error: error.message });
  }
});

// PUT /api/lectures/exercises/:exerciseId - Admin cập nhật Bài tập
router.put('/exercises/:exerciseId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.exerciseId);
    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found' });
    }

    const updatedExercise = await Exercise.findByIdAndUpdate(
      req.params.exerciseId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Exercise updated successfully',
      data: updatedExercise
    });
  } catch (error) {
    console.error('PUT Exercise Error:', error);
    return res.status(500).json({ success: false, message: 'Error updating exercise', error: error.message });
  }
});

// DELETE /api/lectures/exercises/:exerciseId - Admin xóa Bài tập
router.delete('/exercises/:exerciseId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.exerciseId);
    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found' });
    }

    await Exercise.findByIdAndDelete(req.params.exerciseId);

    return res.status(200).json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  } catch (error) {
    console.error('DELETE Exercise Error:', error);
    return res.status(500).json({ success: false, message: 'Error deleting exercise', error: error.message });
  }
});

module.exports = router;
