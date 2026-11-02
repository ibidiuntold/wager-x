import { siteConfig } from '../lib/config';

export function getSiteSettings() {
 return {
   appName: siteConfig.app.name,
   maintenanceMode: siteConfig.app.maintenanceMode,
   seo: {
     title: siteConfig.app.title,
     description: siteConfig.app.description,
     ogImage: siteConfig.app.ogImage,
     favicon: siteConfig.app.favicon
   }
 };
}
