import mongoose from 'mongoose';
const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    mediaUrls: {
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

postSchema.index({ content: 'text' }); 

export const Post = mongoose.model('Post', postSchema);

