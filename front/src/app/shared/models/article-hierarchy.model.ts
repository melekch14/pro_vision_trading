export interface ArticleGroup {
  id: number;
  code: string;
  name: string;
}

export interface ArticleFamily {
  id: number;
  code: string;
  name: string;
  group_id: number;
}

export interface ArticleSubfamily {
  id: number;
  code: string;
  name: string;
  family_id: number;
} 