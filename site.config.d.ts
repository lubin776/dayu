/**
 * site.config.d.ts —— 站点配置的 TypeScript 类型定义（可选，纯 JS 项目可忽略）
 */

export interface SiteSocial {
  label: string;
  icon: 'github' | 'mail' | 'rss' | string;
  href: string;
}

export interface SiteNav {
  label: string;
  href: string;
}

export interface SiteStat {
  label: string;
  value: string;
}

export interface SitePost {
  slug: string;
  title: string;
  date: string;          // YYYY-MM-DD
  tags: string[];
  excerpt: string;
  cover?: string;
}

export interface SiteConfig {
  site: {
    title: string;
    subtitle: string;
    description: string;
    author: string;
    language: string;
    url: string;
    since: number;
  };
  nav: SiteNav[];
  social: SiteSocial[];
  footer: {
    copyright: string;
    icp?: string;
    poweredBy: string;
  };
  hero: {
    avatar: string;
    greeting: string;
    bio: string;
    location?: string;
    stats: SiteStat[];
  };
  about: {
    heading: string;
    paragraphs: string[];
    skills: string[];
  };
  links: { name: string; url: string; desc: string }[];
  posts: SitePost[];
  postNav: {
    prev: string;
    next: string;
    backToList: string;
  };
}

declare const config: SiteConfig;
export default config;
