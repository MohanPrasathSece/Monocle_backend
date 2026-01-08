import mongoose, { Schema, Document } from 'mongoose';
import { DailyStats as DailyStatsType } from '../types';

export interface IDailyStats extends Document, Omit<DailyStatsType, 'id'> { }

const DailyStatsSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    focusTime: { type: Number, default: 0 },
    contextSwitches: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    activeThreads: { type: Number, default: 0 }
});

DailyStatsSchema.set('toJSON', {
    transform: (doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export const DailyStatsModel = mongoose.model<IDailyStats>('DailyStats', DailyStatsSchema);
