//1.Розширення базової структури для різних типів контенту/////////////////////////////
// Базовий інтерфейс для всього контенту
interface BaseContent {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    status: 'draft' | 'published' | 'archived';
  }
  
  // Інтерфейс для статті
  interface Article extends BaseContent {
    title: string;
    content: string;
    authorId: string;
    tags?: string[];
  }
  
  // Інтерфейс для продукту
  interface Product extends BaseContent {
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
  }
  
  // Generic тип для операцій з контентом
  type ContentOperations<T extends BaseContent> = {
    create: (content: T) => T;
    read: (id: string) => T | null;
    update: (id: string, content: Partial<T>) => T;
    delete: (id: string) => void;
  };


//2.Система типів для управління правами доступу/////////////////////////////////////
  // Визначаємо базові ролі та права
type Role = 'admin' | 'editor' | 'viewer';

type Permission = {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
};

// Система контролю доступу
type AccessControl<T extends BaseContent> = {
  [role in Role]: {
    [operation in keyof ContentOperations<T>]: boolean;
  };
};

// Приклад реалізації прав доступу для статті
const articleAccessControl: AccessControl<Article> = {
  admin: {
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  editor: {
    create: true,
    read: true,
    update: true,
    delete: false,
  },
  viewer: {
    create: false,
    read: true,
    update: false,
    delete: false,
  },
};


//3. Система валідації/////////////////////////////////
// Базовий тип для валідатора
type Validator<T> = {
    validate: (data: T) => ValidationResult;
  };
  
  type ValidationResult = {
    isValid: boolean;
    errors?: string[];
  };
  
  // Валідатор для статті
  const articleValidator: Validator<Article> = {
    validate: (data: Article) => {
      const errors: string[] = [];
      if (!data.title) errors.push('Title is required.');
      if (!data.content) errors.push('Content is required.');
      if (!data.authorId) errors.push('Author ID is required.');
  
      return {
        isValid: errors.length === 0,
        errors,
      };
    },
  };
  
  // Валідатор для продукту
  const productValidator: Validator<Product> = {
    validate: (data: Product) => {
      const errors: string[] = [];
      if (!data.name) errors.push('Name is required.');
      if (data.price == null || data.price < 0) errors.push('Price must be a positive number.');
      if (data.stock == null || data.stock < 0) errors.push('Stock must be a positive number.');
  
      return {
        isValid: errors.length === 0,
        errors,
      };
    },
  };
  
  // Композитний валідатор
  type CompositeValidator<T> = Validator<T> & {
    validators: Validator<T>[];
  };
  
  function createCompositeValidator<T>(...validators: Validator<T>[]): CompositeValidator<T> {
    return {
      validators,
      validate: (data: T) => {
        const errors: string[] = [];
        validators.forEach((validator) => {
          const result = validator.validate(data);
          if (!result.isValid && result.errors) {
            errors.push(...result.errors);
          }
        });
        return {
          isValid: errors.length === 0,
          errors,
        };
      },
    };
  }

  // Приклад використання композитного валідатора для статті
  const compositeArticleValidator = createCompositeValidator(articleValidator);


//4. Система версіонування контенту////////////////////////////////////////////////
type Versioned<T extends BaseContent> = T & {
    version: number;
    previousVersions?: T[];
  };
  
  // Приклад реалізації версіонування для статті
  class VersionedContent<T extends BaseContent> {
    private content: Versioned<T>;
  
    constructor(initialContent: T) {
      this.content = {
        ...initialContent,
        version: 1,
        previousVersions: [],
      };
    }
  
    updateContent(newContent: Partial<T>) {
      const previousContent = { ...this.content } as T;
      this.content = {
        ...this.content,
        ...newContent,
        updatedAt: new Date(),
        version: this.content.version + 1,
      };
      this.content.previousVersions?.push(previousContent);
    }
  
    getContent() {
      return this.content;
    }
  
    getVersionHistory() {
      return this.content.previousVersions;
    }
  }