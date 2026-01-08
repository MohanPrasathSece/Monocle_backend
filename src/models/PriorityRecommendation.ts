import mongoose, { Schema, Document } from 'mongoose';
import { PriorityRecommendation as PriorityRecommendationType } from '../types';

export interface IPriorityRecommendation extends Document, Omit<PriorityRecommendationType, 'id'> { }

const PriorityFactorSchema = new Schema({
    label: { type: String, required: true },
    weight: { type: String, enum: ['high', 'medium', 'low'], required: true },
    description: { type: String, required: true }
}, { _id: false });

const PriorityRecommendationSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    threadId: { type: String, required: true, index: true },
    score: { type: Number, required: true },
    reasoning: {
        title: { type: String, required: true },
        description: { type: String, required: true },
        factors: [PriorityFactorSchema]
    },
    generatedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});

PriorityRecommendationSchema.set('toJSON', {
    transform: (doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export const PriorityRecommendationModel = mongoose.model<IPriorityRecommendation>('PriorityRecommendation', PriorityRecommendationSchema);
