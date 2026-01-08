import mongoose, { Schema, Document } from 'mongoose';
import { WorkInsight as WorkInsightType } from '../types';

export interface IWorkInsight extends Document, Omit<WorkInsightType, 'id'> { }

const WorkInsightSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    type: {
        type: String,
        enum: ['attention-leak', 'ignored-work', 'overload', 'momentum-drift', 'deadline-risk'],
        required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    relatedThreadIds: [{ type: String }],
    actionSuggestion: { type: String },
    detectedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    isDismissed: { type: Boolean, default: false }
});

WorkInsightSchema.set('toJSON', {
    transform: (doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export const WorkInsightModel = mongoose.model<IWorkInsight>('WorkInsight', WorkInsightSchema);
