export interface ArticleTranslation {
  title: string;
  excerpt: string;
  content: any; // Edra editor JSON content
  language: string;
  slug?: string; // language-specific slug
}

export interface ArticleData {
  id?: string;
  slug?: string;
  translations: Record<string, ArticleTranslation>;
  category: string;
  subcategory: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  collaborators: string[]; // User IDs
  authorId: string;
  thumbnail?: string; // image url/path for cover
  createdAt?: Date;
  updatedAt?: Date;
  publishedAt?: Date;
  version: number;
  defaultLanguage?: string; // the primary language for slug redirects
}

export interface ArticleVersion {
  id: string;
  articleId: string;
  version: number;
  data: ArticleData;
  createdBy: string;
  createdAt: Date;
  changeNote?: string;
}

export interface CollaborationState {
  userId: string;
  language: string;
  lastActiveAt: Date;
  isEditing: boolean;
  currentField?: 'title' | 'excerpt' | 'content';
}