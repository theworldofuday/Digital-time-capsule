export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  joinDate: string;
  lastLogin?: string;
  capsulesCreated?: string[];
}

export interface TimeCapsule {
  id: string;
  title: string;
  description: string;
  content?: {
    message?: string;
    files?: CapsuleFile[];
  };
  creator: User;
  createdDate: string;
  revealDate: string;
  isRevealed: boolean;
  isPublic: boolean;
  category: CapsuleCategory;
  tags: string[];
  views: number;
  likes: Like[];
  comments: Comment[];
  position: Position3D;
  color: string;
  timeRemaining: number;
  daysRemaining: number;
  likeCount: number;
  commentCount: number;
}

export interface CapsuleFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  thumbnailPath?: string;
  encryptedPath?: string;
  isEncrypted: boolean;
}

export interface Like {
  user: string;
  likedAt: string;
}

export interface Comment {
  _id: string;
  user: User;
  text: string;
  createdAt: string;
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export type CapsuleCategory = 
  | 'personal' 
  | 'family' 
  | 'friendship' 
  | 'achievement' 
  | 'memory' 
  | 'wish' 
  | 'prediction' 
  | 'other';

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  bio?: string;
}

export interface CreateCapsuleData {
  title: string;
  description: string;
  message?: string;
  revealDate: string;
  category: CapsuleCategory;
  isPublic: boolean;
  tags: string[];
  files?: File[];
}

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CapsuleListResponse {
  capsules: TimeCapsule[];
  pagination: PaginationMeta;
}