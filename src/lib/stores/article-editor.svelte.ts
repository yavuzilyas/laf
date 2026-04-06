import { browser } from '$app/environment';
import { getCurrentLocale } from '$lib/stores/i18n.svelte.js';
import type {
	ArticleData,
	ArticleTranslation,
	ArticleVersion,
	CollaborationState
} from '$lib/types/article';

class ArticleEditorStore {
  private _articleData = $state<ArticleData>({
    translations: {},
    category: '',
    subcategory: '',
    tags: [],
    status: 'draft',
    collaborators: [],
    authorId: '',
    version: 1,
    defaultLanguage: undefined,
    thumbnail: ''
  });

  private _activeLanguage = $state(getCurrentLocale());
  private _availableLanguages = $state<string[]>([getCurrentLocale()]);
  private _isLoading = $state(false);
  private _isSaving = $state(false);
  private _collaborationStates = $state<Record<string, CollaborationState>>({});
  private _versions = $state<ArticleVersion[]>([]);
  private _isTranslator = $state(false);

  constructor() {
    this.initialize();
  }

  get articleData() {
    return this._articleData;
  }

  get activeLanguage() {
    return this._activeLanguage;
  }

  get availableLanguages() {
    return this._availableLanguages;
  }

  get isLoading() {
    return this._isLoading;
  }

  get isSaving() {
    return this._isSaving;
  }


  get collaborationStates() {
    return this._collaborationStates;
  }

  get isPublished() {
    return this._articleData.status === 'published';
  }

  get isTranslator() {
    return this._isTranslator;
  }

  get currentTranslation() {
    return this._articleData.translations[this._activeLanguage] || {
      title: '',
      excerpt: '',
      content: null,
      language: this._activeLanguage
    };
  }

  initialize(initialData?: (Partial<ArticleData> & { availableLanguages?: string[]; translations?: Record<string, ArticleTranslation> })) {
    const currentLocale = getCurrentLocale();

    const merged: ArticleData & { availableLanguages?: string[] } = {
      category: '',
      subcategory: '',
      tags: [],
      status: 'draft',
      collaborators: [],
      authorId: '',
      version: 1,
      defaultLanguage: currentLocale,
      thumbnail: '',
      translations: {} as Record<string, ArticleTranslation>,
      ...initialData
    };

    merged.translations = initialData?.translations ? { ...initialData.translations } : {} as Record<string, ArticleTranslation>;

    merged.tags = Array.isArray(merged.tags) ? merged.tags : [];
    merged.collaborators = Array.isArray(merged.collaborators) ? merged.collaborators : [];
    merged.authorId = merged.authorId ?? '';
    merged.version = merged.version ?? 1;
    merged.defaultLanguage = merged.defaultLanguage ?? currentLocale;

    let languages = initialData?.availableLanguages?.length
      ? [...new Set(initialData.availableLanguages)]
      : Object.keys(merged.translations);

    if (!languages.includes(merged.defaultLanguage)) {
      languages = [merged.defaultLanguage, ...languages];
    }

    if (languages.length === 0) {
      languages = [merged.defaultLanguage];
    }

    const translations: Record<string, ArticleTranslation> = {};
    for (const lang of languages) {
      const source = merged.translations[lang] ?? {};
      translations[lang] = {
        title: source?.title ?? '',
        excerpt: source?.excerpt ?? '',
        content: source?.content ?? null,
        language: source?.language || lang,
        slug: source?.slug ?? ''
      };
    }

    merged.translations = translations;
    this._articleData = merged;

    this._availableLanguages = Object.keys(translations);
    this._activeLanguage = this._availableLanguages.includes(merged.defaultLanguage)
      ? merged.defaultLanguage
      : this._availableLanguages[0];
    this._articleData.defaultLanguage = this._activeLanguage;

    this._versions = [];
    this._collaborationStates = {};
    this._isLoading = false;
    this._isSaving = false;

    delete (this._articleData as any).availableLanguages;
  }

  hydrate(article: Partial<ArticleData> & { availableLanguages?: string[]; translations?: Record<string, ArticleTranslation> }) {
    if (!article) return;
    this.initialize(article);
  }

  setActiveLanguage(language: string) {
    if (this._availableLanguages.includes(language)) {
      this._activeLanguage = language;

      // Initialize translation if not exists
      if (!this._articleData.translations[language]) {
        this._articleData.translations[language] = {
          title: '',
          excerpt: '',
          content: null,
          language: language
        };
      }
    }
  }

  addLanguage(language: string) {
    if (!this._availableLanguages.includes(language)) {
      this._availableLanguages = [...this._availableLanguages, language];

      // Initialize empty translation
      this._articleData.translations[language] = {
        title: '',
        excerpt: '',
        content: null,
        language: language,
        slug: ''
      };

      this.markAsChanged();
    }
  }

  removeLanguage(language: string) {
    if (this._availableLanguages.length > 1 && language !== getCurrentLocale()) {
      this._availableLanguages = this._availableLanguages.filter(lang => lang !== language);
      delete this._articleData.translations[language];

      if (this._activeLanguage === language) {
        this._activeLanguage = this._availableLanguages[0];
      }

      this.markAsChanged();
    }
  }

  updateTranslation(language: string, field: keyof ArticleTranslation, value: any) {
    if (!this._articleData.translations[language]) {
      this._articleData.translations[language] = {
        title: '',
        excerpt: '',
        content: null,
        language: language,
        slug: ''
      };
    }

    this._articleData.translations[language][field] = value;
    this.markAsChanged();
  }

  updateCurrentTranslation(field: keyof ArticleTranslation, value: any) {
    this.updateTranslation(this._activeLanguage, field, value);
  }

  updateMetadata(field: keyof Omit<ArticleData, 'translations'>, value: any) {
    (this._articleData as any)[field] = value;
    this.markAsChanged();
  }

  addTag(tag: string) {
    if (tag.trim() && !this._articleData.tags.includes(tag.trim())) {
      this._articleData.tags = [...this._articleData.tags, tag.trim()];
      this.markAsChanged();
    }
  }

  removeTag(tag: string) {
    this._articleData.tags = this._articleData.tags.filter(t => t !== tag);
    this.markAsChanged();
  }

  addCollaborator(userId: string) {
    if (!this._articleData.collaborators.includes(userId)) {
      this._articleData.collaborators = [...this._articleData.collaborators, userId];
      this.markAsChanged();
    }
  }

  removeCollaborator(userId: string) {
    this._articleData.collaborators = this._articleData.collaborators.filter(id => id !== userId);
    this.markAsChanged();
  }

  async ensureArticleId() {
    if (this._articleData.id) {
      return this._articleData.id;
    }

    const originalStatus = this._articleData.status;

    try {
      const saved = await this.saveDraft();

      if (!saved || !this._articleData.id) {
        throw new Error('Unable to establish article identifier');
      }

      return this._articleData.id;
    } catch (error) {
      throw error;
    } finally {
      this._articleData.status = originalStatus;
    }
  }

  get articleId() {
    return this._articleData.id;
  }

  setTranslatorMode(value: boolean) {
    this._isTranslator = value;
  }

  private markAsChanged() {
    this._articleData.updatedAt = new Date();
  }

  async loadDraft() {
    if (!browser) return;

    this._isLoading = true;
    try {
      const response = await fetch('/api/articles/draft');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          this._articleData = { ...data };
          this._availableLanguages = Object.keys(data.translations);
        }
      }
    } catch (error) {
    } finally {
      this._isLoading = false;
    }
  }

  async saveAsDraft() {
    if (!browser) return false;

    this._isSaving = true;
    try {
      // Get honeypot field value
      const honeypotField = document.querySelector('input[name="website"]') as HTMLInputElement;
      const honeypotValue = honeypotField?.value || '';

      const response = await fetch('/api/articles/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...this._articleData,
          status: 'draft',
          website: honeypotValue,
          isTranslator: this._isTranslator
        })
      });

      if (response.ok) {
        const result = await response.json();
        this._articleData.id = result.articleId || this._articleData.id;
        this._articleData.status = 'draft';
        return result;
      } else if (response.status === 429) {
        throw new Error('Too many articles created. Please wait before creating another article.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to save draft';
        if (errorData.reasons && Array.isArray(errorData.reasons)) {
          throw new Error(`${errorMessage}: ${errorData.reasons.join(', ')}`);
        } else {
          throw new Error(errorMessage);
        }
      }
      return false;
    } catch (error) {
      throw error;
    } finally {
      this._isSaving = false;
    }
  }

  async saveDraft() {
    if (!browser) return false;

    this._isSaving = true;
    try {
      const response = await fetch('/api/articles/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...this._articleData,
          status: 'draft'
        })
      });

      if (response.ok) {
        const result = await response.json();
        this._articleData.id = result.articleId || this._articleData.id;
        return true;
      }
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Server error: ${response.status}`;
      throw new Error(errorMessage);
    } finally {
      this._isSaving = false;
    }
  }

  async publishArticle() {
    if (!browser) return false;

    // Validation
    const defaultLang = this._articleData.defaultLanguage || getCurrentLocale();
    const primaryTranslation =
      this._articleData.translations[defaultLang] ||
      this._articleData.translations[this._activeLanguage] ||
      this._articleData.translations[getCurrentLocale()];

    if (!primaryTranslation || !primaryTranslation.title?.trim() || !primaryTranslation.content) {
      throw new Error('Title and content are required for the primary language');
    }

    // Title validation: at least 5 characters
    if (primaryTranslation.title.trim().length < 5) {
      throw new Error('Title must be at least 5 characters long');
    }

    // Excerpt/description validation: at least 20 characters
    if (!primaryTranslation.excerpt || primaryTranslation.excerpt.trim().length < 20) {
      throw new Error('Description must be at least 20 characters long');
    }

    // Thumbnail validation: required
    if (!this._articleData.thumbnail || this._articleData.thumbnail.trim() === '') {
      throw new Error('Thumbnail image is required');
    }

    // Category validation: must be selected
    if (!this._articleData.category || this._articleData.category.trim() === '') {
      throw new Error('Category is required');
    }

    // Tags validation: at least 5 tags
    if (!this._articleData.tags || this._articleData.tags.length < 5) {
      throw new Error('At least 5 tags are required');
    }

    // Content validation: at least 2 paragraphs
    const content = primaryTranslation.content;
    if (content && typeof content === 'object') {
      const paragraphs = content.content?.filter((node: any) => node.type === 'paragraph') || [];
      const nonEmptyParagraphs = paragraphs.filter((p: any) => {
        const hasContent = p.content?.some((node: any) => node.text && node.text.trim() !== '');
        return hasContent;
      });
      if (nonEmptyParagraphs.length < 2) {
        throw new Error('Content must contain at least 2 paragraphs');
      }
    } else {
      throw new Error('Content is required');
    }

    // Translation size validation: each translation must be within +/-15% of original content size
    const originalContent = this._articleData.translations[defaultLang]?.content;
    if (originalContent) {
      const originalSize = new Blob([JSON.stringify(originalContent)]).size;
      const minSize = Math.floor(originalSize * 0.80); // -15%
      const maxSize = Math.ceil(originalSize * 1.20); // +15%
      
      for (const [lang, translation] of Object.entries(this._articleData.translations)) {
        if (lang === defaultLang) continue; // Skip default language
        if (!translation?.content) continue; // Skip empty translations
        
        const translationSize = new Blob([JSON.stringify(translation.content)]).size;
        if (translationSize < minSize) {
          throw new Error(`${lang.toUpperCase()} translation is too small (${translationSize} bytes vs ${originalSize} bytes original). Must be within -15%/+15% (${minSize}-${maxSize} bytes)`);
        }
        if (translationSize > maxSize) {
          throw new Error(`${lang.toUpperCase()} translation is too large (${translationSize} bytes vs ${originalSize} bytes original). Must be within -15%/+15% (${minSize}-${maxSize} bytes)`);
        }
      }
    }

    this._isSaving = true;
    try {
      // Get honeypot field value
      const honeypotField = document.querySelector('input[name="website"]') as HTMLInputElement;
      const honeypotValue = honeypotField?.value || '';

      const response = await fetch('/api/articles/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...this._articleData,
          status: 'published',
          publishedAt: new Date(),
          website: honeypotValue, // Honeypot field for spam protection
          isTranslator: this._isTranslator // Pass translator mode to API
        })
      });

      if (response.ok) {
        const result = await response.json();
        this._articleData.id = result.articleId || this._articleData.id;
        this._articleData.status = 'published';
        // Clear honeypot field
        if (honeypotField) honeypotField.value = '';
        return result;
      } else if (response.status === 429) {
        throw new Error('Too many articles created. Please wait before creating another article.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to publish article';
        if (errorData.reasons && Array.isArray(errorData.reasons)) {
          throw new Error(`${errorMessage}: ${errorData.reasons.join(', ')}`);
        } else {
          throw new Error(errorMessage);
        }
      }
      return false;
    } catch (error) {
      throw error;
    } finally {
      this._isSaving = false;
    }
  }

  async loadVersions() {
    if (!browser || !this._articleData.id) return;

    try {
      const response = await fetch(`/api/articles/${this._articleData.id}/versions`);
      if (response.ok) {
        this._versions = await response.json();
      }
    } catch (error) {
    }
  }

  async createVersion(changeNote?: string) {
    if (!browser || !this._articleData.id) return false;

    try {
      const response = await fetch(`/api/articles/${this._articleData.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: this._articleData,
          changeNote
        })
      });

      if (response.ok) {
        const version = await response.json();
        this._versions = [version, ...this._versions];
        this._articleData.version++;
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  destroy() {
    // No-op: autosave removed
  }
}

export const articleEditor = new ArticleEditorStore();
