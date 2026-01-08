import { TeamModel } from '../models/Team';
import { InvitationModel } from '../models/Invitation';
import { UserModel } from '../models/User';
import { MailService } from './mail.service';
import crypto from 'crypto';

export class TeamService {

    static async createTeam(ownerId: string, name: string, description?: string) {
        // Get owner details
        const owner = await UserModel.findById(ownerId);
        if (!owner) throw new Error('User not found');

        const team = new TeamModel({
            name,
            description,
            ownerId,
            members: [{
                userId: ownerId,
                role: 'admin',
                joinedAt: new Date(),
                email: owner.email,
                name: owner.name
            }]
        });
        return await team.save();
    }

    static async getMyTeams(userId: string) {
        return await TeamModel.find({ 'members.userId': userId });
    }

    static async getTeam(teamId: string, userId: string) {
        const team = await TeamModel.findById(teamId);
        if (!team) throw new Error('Team not found');

        // Security check: must be a member
        const membership = team.members.find(m => m.userId === userId);
        if (!membership) throw new Error('Not authorized to view this team');

        return team;
    }

    static async inviteMember(teamId: string, inviterId: string, email: string) {
        const team = await TeamModel.findById(teamId);
        if (!team) throw new Error('Team not found');

        // Check if inviter is admin
        const inviter = team.members.find(m => m.userId === inviterId);
        if (!inviter || inviter.role !== 'admin') {
            throw new Error('Only admins can invite members');
        }

        // Check if already a member
        const existingMember = team.members.find(m => m.email === email);
        if (existingMember) throw new Error('User is already a team member');

        // Create Invitation
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        const invitation = await InvitationModel.create({
            teamId,
            inviterId,
            email,
            token,
            expiresAt
        });

        const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/teams/join?token=${token}`;

        // Send invitation email
        await MailService.sendTeamInvite(email, team.name, inviteLink);

        return {
            invitationId: invitation.id,
            token,
            link: inviteLink
        };
    }

    static async getTeamInvitations(teamId: string) {
        return await InvitationModel.find({ teamId });
    }

    static async acceptInvite(userId: string, token: string) {
        const invitation = await InvitationModel.findOne({ token, status: 'pending' });
        if (!invitation) throw new Error('Invalid or expired invitation');

        if (invitation.expiresAt < new Date()) {
            invitation.status = 'expired';
            await invitation.save();
            throw new Error('Invitation expired');
        }

        const team = await TeamModel.findById(invitation.teamId);
        if (!team) throw new Error('Team does not exist');

        const user = await UserModel.findById(userId);
        if (!user) throw new Error('User not found');

        // Check if already in team
        if (team.members.some(m => m.userId === userId)) {
            // Already member, just mark invite accepted
            invitation.status = 'accepted';
            await invitation.save();
            return team;
        }

        // Add member
        team.members.push({
            userId: user.id,
            role: 'member',
            joinedAt: new Date(),
            email: user.email,
            name: user.name
        });
        await team.save();

        invitation.status = 'accepted';
        await invitation.save();

        return team;
    }

    static async removeMember(teamId: string, adminId: string, memberIdToRemove: string) {
        const team = await TeamModel.findById(teamId);
        if (!team) throw new Error('Team not found');

        const admin = team.members.find(m => m.userId === adminId);
        if (!admin || admin.role !== 'admin') {
            throw new Error('Only admins can remove members');
        }

        if (adminId === memberIdToRemove) {
            throw new Error('Cannot remove yourself. Delete the team instead.');
        }

        team.members = team.members.filter(m => m.userId !== memberIdToRemove);
        await team.save();

        return team;
    }

    static async updateMemberRole(teamId: string, adminId: string, memberId: string, newRole: 'admin' | 'member') {
        const team = await TeamModel.findById(teamId);
        if (!team) throw new Error('Team not found');

        const admin = team.members.find(m => m.userId === adminId);
        if (!admin || admin.role !== 'admin') {
            throw new Error('Only admins can change roles');
        }

        const member = team.members.find(m => m.userId === memberId);
        if (!member) throw new Error('Member not found in team');

        member.role = newRole;
        await team.save();

        return team;
    }
}
