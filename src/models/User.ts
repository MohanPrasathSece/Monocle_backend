import mongoose, { Schema, Document } from 'mongoose';
import { User as UserType, UserPreferences } from '../types';

export interface IUser extends Document, Omit<UserType, 'id'> {
    password?: string;
}

const UserPreferencesSchema = new Schema<UserPreferences>({
    workHoursStart: { type: Number, default: 9 },
    workHoursEnd: { type: Number, default: 17 },
    focusTimeGoal: { type: Number, default: 240 },
    notificationsEnabled: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' }
}, { _id: false });

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    avatar: { type: String },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    preferences: { type: UserPreferencesSchema, default: () => ({}) },
    integrations: {
        google: {
            connected: { type: Boolean, default: false },
            lastSync: { type: Date },
            email: { type: String },
            accessToken: { type: String },
            refreshToken: { type: String }
        },
        microsoft: {
            connected: { type: Boolean, default: false },
            lastSync: { type: Date },
            email: { type: String },
            accessToken: { type: String },
            refreshToken: { type: String }
        },
        notion: {
            connected: { type: Boolean, default: false },
            apiKey: { type: String }, // Storing user provided key for simplicity
            lastSync: { type: Date }
        }
    },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
});

// Use a standard MongoDB ID for all users.
UserSchema.set('toJSON', {
    transform: (doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);
