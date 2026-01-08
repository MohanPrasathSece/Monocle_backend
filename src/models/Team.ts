import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
    name: string;
    description?: string;
    ownerId: string;
    members: {
        userId: string;
        role: 'admin' | 'member';
        joinedAt: Date;
        email: string;
        name: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const TeamSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    ownerId: { type: String, required: true, index: true },
    members: [{
        userId: { type: String, required: true },
        role: { type: String, enum: ['admin', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
        email: { type: String },
        name: { type: String }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index for efficiently finding a user's teams
TeamSchema.index({ 'members.userId': 1 });

TeamSchema.set('toJSON', {
    transform: (doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export const TeamModel = mongoose.model<ITeam>('Team', TeamSchema);
