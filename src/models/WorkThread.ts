import mongoose, { Schema, Document } from 'mongoose';
import { WorkThread as WorkThreadType } from '../types';

export interface IWorkThread extends Document, Omit<WorkThreadType, 'id'> { }

const WorkThreadSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    itemIds: [{ type: String }],
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    deadline: { type: Date },
    lastActivity: { type: Date, default: Date.now },
    progress: { type: Number, default: 0 },
    isIgnored: { type: Boolean, default: false },
    relatedPeople: [{ type: String }],
    tags: [{ type: String }],
    teamId: { type: String, index: true },
    assigneeId: { type: String, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

WorkThreadSchema.set('toJSON', {
    transform: (doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export const WorkThreadModel = mongoose.model<IWorkThread>('WorkThread', WorkThreadSchema);
