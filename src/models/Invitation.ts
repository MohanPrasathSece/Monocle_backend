import mongoose, { Schema, Document } from 'mongoose';

export interface IInvitation extends Document {
    teamId: string;
    inviterId: string;
    email: string;
    token: string;
    status: 'pending' | 'accepted' | 'expired';
    expiresAt: Date;
    createdAt: Date;
}

const InvitationSchema: Schema = new Schema({
    teamId: { type: String, required: true, index: true },
    inviterId: { type: String, required: true },
    email: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

InvitationSchema.set('toJSON', {
    transform: (doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export const InvitationModel = mongoose.model<IInvitation>('Invitation', InvitationSchema);
