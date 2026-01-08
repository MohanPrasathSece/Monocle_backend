import express from 'express';
import { TeamController } from '../controllers/team.controller';

const router = express.Router();

router.post('/', TeamController.createTeam);
router.get('/', TeamController.getMyTeams);
router.post('/join', TeamController.acceptInvite);
router.get('/:id', TeamController.getTeam);
router.post('/:id/invite', TeamController.inviteMember);
router.get('/:id/invitations', TeamController.getInvitations);
router.delete('/:id/members/:memberId', TeamController.removeMember);
router.patch('/:id/members/:memberId/role', TeamController.updateMemberRole);

export default router;
