export type ModerationUserStatus = 'active' | 'restricted' | 'hidden';
export type ModerationUserRole = 'user' | 'moderator' | 'admin';

export type ModerationUserRow = {
  id: string;
  fullName: string | null;
  nickname: string;
  email: string | null;
  status: ModerationUserStatus;
  statusExplanation?: string | null;
  createdAt: string | null;
  role: ModerationUserRole;
  canModify: boolean;
};

export type ModerationTrashRow = {
  id: string;
  fullName: string | null;
  nickname: string;
  email: string | null;
  role: ModerationUserRole;
  canModify: boolean;
  deletion: {
    source: 'user' | 'admin';
    requestedAt: string | null;
    scheduledAt: string | null;
    remainingMs: number;
  };
};

export type ModerationUserLists = {
  activeUsers: ModerationUserRow[];
  trashUsers: ModerationTrashRow[];
};
