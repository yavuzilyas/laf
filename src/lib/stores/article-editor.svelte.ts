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

  constructor() {
    // Initialize with current locale
    this.initializeLanguage();
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

  get versions() {
    return this._versions;
  }

  get currentTranslation() {
    return this._articleData.translations[this._activeLanguage] || {
      title: '',
      excerpt: '',
      content: null,
      language: this._activeLanguage
    };
  }

  private initializeLanguage() {
    const currentLocale = getCurrentLocale();
    this._activeLanguage = currentLocale;
    this._availableLanguages = [currentLocale];
    this._articleData.defaultLanguage = currentLocale;

    // Initialize translation for current language
    if (!this._articleData.translations[currentLocale]) {
      this._articleData.translations[currentLocale] = {
        title: '',
        excerpt: '',
        content: null,
        language: currentLocale
      };
    }
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
        language: language
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
        language: language
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
      console.error('Failed to load draft:', error);
    } finally {
      this._isLoading = false;
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
      return false;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return false;
    } finally {
      this._isSaving = false;
    }
  }

  async publishArticle() {
    if (!browser) return false;

    // Validation
    const primaryLang = getCurrentLocale();
    const primaryTranslation = this._articleData.translations[primaryLang];

    if (!primaryTranslation?.title.trim() || !primaryTranslation?.content) {
      throw new Error('Title and content are required for the primary language');
    }

    this._isSaving = true;
    try {
      const response = await fetch('/api/articles/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...this._articleData,
          status: 'published',
          publishedAt: new Date()
        })
      });

      if (response.ok) {
        const result = await response.json();
        this._articleData.id = result.articleId || this._articleData.id;
        this._articleData.status = 'published';
        return result;
      }
      return false;
    } catch (error) {
      console.error('Failed to publish article:', error);
      return false;
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
      console.error('Failed to load versions:', error);
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
      console.error('Failed to create version:', error);
      return false;
    }
  }

  destroy() {
    // No-op: autosave removed
  }
}

export const articleEditor = new ArticleEditorStore();
