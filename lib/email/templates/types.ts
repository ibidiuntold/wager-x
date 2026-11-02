export interface EmailTemplate {
  subject: string | ((displayName: string) => string);
  getHtml: (params: Record<string, string>) => string;
}
