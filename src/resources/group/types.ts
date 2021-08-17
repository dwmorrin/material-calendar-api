export interface UserGroupRecord {
  id?: number;
  title: string;
  project_id: number;
  creator_id: number;
  admin_created_id?: number;
  admin_approved_id?: number;
  admin_rejected_id?: number;
  pending?: boolean;
  abandoned?: boolean;
  exception_size?: boolean;
}

export interface CreateGroupRequest {
  title: string;
  projectId: number;
  members: number[];
  approved: boolean;
  mail: {
    to: string;
    subject: string;
    text: string;
  };
}

interface UserGroupMember {
  id: number;
  username: string;
  name: {
    first: string;
    middle: string;
    last: string;
  };
  invitation: {
    accepted: boolean;
    rejected: boolean;
  };
  email: string;
}

// record from project_group_view
export interface UserGroup {
  id: number;
  projectId: number;
  creatorId: number;
  title: string;
  pending: boolean;
  members: UserGroupMember[];
  exceptionalSize: boolean;
  reservedHours: number;
}
