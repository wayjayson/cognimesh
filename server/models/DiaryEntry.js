import mongoose from 'mongoose';

const diarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  situation: {
    type: String,
    default: '',
    maxlength: 500
  },
  thought: {
    type: String,
    default: '',
    maxlength: 1000
  },
  valence: {
    type: Number,
    required: true,
    min: -5,
    max: 5
  },
  arousal: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  emotion: {
    type: String,
    default: ''
  }
}, { timestamps: true });

diarySchema.index({ user: 1, date: 1 });

export default mongoose.model('DiaryEntry', diarySchema);
