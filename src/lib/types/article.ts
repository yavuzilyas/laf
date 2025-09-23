// src/lib/types/article.ts
export interface ArticleTranslation {
  title: string;
  summary: string;
  content: string;
  slug: string;
}

export interface Article {
  _id?: string;
  translations: {
    [key: string]: ArticleTranslation;
  };
  defaultLanguage: string;
  status: 'draft' | 'published' | 'scheduled';
  authorId: string;
  
  // Ortak alanlar (dilden bağımsız)
  category: string;
  tags: string[];
  coverImage?: string;
  featured: boolean;
  allowComments: boolean;
  
  // İstatistikler
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
  
  // Zaman damgaları
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  scheduledAt?: Date;
}

export interface ArticleDraft {
  _id?: string;
  articleId?: string;
  data: Partial<Article>;
  lastSaved: Date;
  authorId: string;
  hasUnpublishedChanges: boolean;
}

export interface ArticleVersion {
  _id?: string;
  articleId: string;
  versionNumber: number;
  data: Article;
  createdAt: Date;
  authorId: string;
  note?: string; // Versiyon notu
}