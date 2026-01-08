import mongoose, { Schema, Document } from 'mongoose';
import { CognitiveLoadState as CognitiveLoadStateType } from '../types';

export interface ICognitiveLoadState extends Document, Omit<CognitiveLoadStateType, 'id'> { }

const CognitiveLoadStateSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    level: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    score: { type: Number, required: true },
    factors: {
        activeThreads: { type: Number, required: true },
        switchingFrequency: { type: Number, required: true },
        workDuration: { type: Number, required: true },
        pendingDeadlines: { type: Number, required: true }
    },
    timestamp: { type: Date, default: Date.now }
});

CognitiveLoadStateSchema.set('toJSON', {
    transform: (doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export const CognitiveLoadStateModel = mongoose.model<ICognitiveLoadState>('CognitiveLoadState', CognitiveLoadStateSchema);
