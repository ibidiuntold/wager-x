import React from 'react';
import { siteConfig } from '../lib/config';

export function Metadata({ children }: { children: React.ReactNode }) {
 return (
   <>
     <title>{siteConfig.app.title}</title>
     <meta name="description" content={siteConfig.app.description} />
     <meta property="og:title" content={siteConfig.app.title} />
     <meta property="og:description" content={siteConfig.app.description} />
     <meta property="og:image" content={siteConfig.app.ogImage} />
     <link rel="icon" href={siteConfig.app.favicon} />
     {children}
   </>
 );
}