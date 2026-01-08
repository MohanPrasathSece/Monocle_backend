import mongoose, { Schema, Document } from 'mongoose';
import { Activity as ActivityType } from '../types';

export interface IActivity extends Document, Omit<ActivityType, 'id'> { }

const ActivitySchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    type: {
        type: String,
        enum: ['thread-created', 'thread-updated', 'item-added', 'context-switch', 'focus-session'],
        required: true
    },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Map, of: Schema.Types.Mixed }
});

ActivitySchema.set('toJSON', {
    transform: (doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export const ActivityModel = mongoose.model<IActivity>('Activity', ActivitySchema);
