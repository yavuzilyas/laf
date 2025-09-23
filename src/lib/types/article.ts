// types/article.ts
export interface ArticleTranslation {
  language: string;
  title: string;
  excerpt: string;
  content: any; // Editor JSON content
  slug: string;
  isActive: boolean;
}

export interface Article {
  _id?: string;
  authorId: string;
  translations: ArticleTranslation[];
  category: string;
  subCategory?: string;
  tags: string[];
  status: 'draft' | 'published';
  featuredImage?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  currentVersion: number;
}

export interface ArticleVersion {
  _id?: string;
  articleId: string;
  version: number;
  translations: ArticleTranslation[];
  category: string;
  subCategory?: string;
  tags: string[];
  status: 'draft' | 'published';
  createdAt: Date;
  createdBy: string;
  changeDescription?: string;
}

export interface ArticleDraft {
  _id?: string;
  articleId?: string; // null for new articles
  authorId: string;
  translations: ArticleTranslation[];
  category: string;
  subCategory?: string;
  tags: string[];
  lastSavedAt: Date;
  autoSave: boolean;
}