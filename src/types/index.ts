export type UserRole = 'student' | 'faculty' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  createdAt: any;
}

export interface Material {
  id: string;
  title: string;
  content: string;
  description?: string;
  type: 'research_paper' | 'subject_material' | 'question_paper';
  facultyId: string;
  facultyName: string;
  status: 'pending' | 'validated';
  createdAt: any;
  updatedAt?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: any;
}
