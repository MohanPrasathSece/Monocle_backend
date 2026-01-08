// Monocle Core Types

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    createdAt: Date;
    lastLogin?: Date;
    preferences?: UserPreferences;
    isVerified?: boolean;
    verificationToken?: string;
    verificationTokenExpires?: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    integrations?: {
        google?: {
            connected: boolean;
            lastSync?: Date;
            email?: string;
            accessToken?: string;
            refreshToken?: string;
        };
        notion?: {
            connected: boolean;
            apiKey?: string;
            lastSync?: Date;
        };
        microsoft?: {
            connected: boolean;
            lastSync?: Date;
            email?: string;
            accessToken?: string;
            refreshToken?: string;
        };
    };
}

export interface UserPreferences {
    workHoursStart: number; // Hour of day (0-23)
    workHoursEnd: number;
    focusTimeGoal: number; // minutes per day
    notificationsEnabled: boolean;
    theme: 'light' | 'dark' | 'auto';
}

export interface WorkItem {
    id: string;
    userId: string;
    type: 'email' | 'message' | 'document' | 'calendar' | 'task';
    title: string;
    source: string;
    timestamp: Date;
    preview?: string;
    isRead?: boolean;
    priority?: 'high' | 'medium' | 'low';
    status?: 'todo' | 'in-progress' | 'completed';
    threadId?: string;
    teamId?: string;
    assigneeId?: string;
    metadata?: Record<string, any>;
}

export interface WorkThread {
    id: string;
    userId: string;
    title: string;
    description?: string;
    itemIds: string[];
    priority: 'high' | 'medium' | 'low';
    deadline?: Date;
    lastActivity: Date;
    progress: number; // 0-100
    isIgnored?: boolean;
    relatedPeople?: string[];
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
    teamId?: string;
    assigneeId?: string;
}

export interface Team {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    members: TeamMember[];
    createdAt: Date;
}

export interface TeamMember {
    userId: string;
    role: 'admin' | 'member';
    joinedAt: Date;
    email?: string;
    name?: string;
}

export interface Invitation {
    id: string;
    teamId: string;
    inviterId: string;
    email: string;
    status: 'pending' | 'accepted' | 'expired';
    expiresAt: Date;
}

export interface PriorityRecommendation {
    id: string;
    userId: string;
    threadId: string;
    score: number; // 0-100
    reasoning: {
        title: string;
        description: string;
        factors: PriorityFactor[];
    };
    generatedAt: Date;
    isActive: boolean;
}

export interface PriorityFactor {
    label: string;
    weight: 'high' | 'medium' | 'low';
    description: string;
}

export interface WorkInsight {
    id: string;
    userId: string;
    type: 'attention-leak' | 'ignored-work' | 'overload' | 'momentum-drift' | 'deadline-risk';
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
    relatedThreadIds?: string[];
    actionSuggestion?: string;
    detectedAt: Date;
    isActive: boolean;
    isDismissed?: boolean;
}

export interface CognitiveLoadState {
    id: string;
    userId: string;
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number; // 0-100
    factors: {
        activeThreads: number;
        switchingFrequency: number; // per hour
        workDuration: number; // hours
        pendingDeadlines: number;
    };
    timestamp: Date;
}

export interface DailyStats {
    id: string;
    userId: string;
    date: Date;
    focusTime: number; // minutes
    contextSwitches: number;
    completedTasks: number;
    activeThreads: number;
}

export interface Activity {
    id: string;
    userId: string;
    type: 'thread-created' | 'thread-updated' | 'item-added' | 'context-switch' | 'focus-session';
    timestamp: Date;
    metadata: Record<string, any>;
}
