"use client";

import React from 'react';
import LayoutSelector from '@/components/common/LayoutSelector';
import pagesContent from './pages-content.json';
import { Calendar, Clock, Shield, FileText, Info, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface GenericPageProps {
  pageKey: keyof typeof pagesContent;
}

const GenericPage: React.FC<GenericPageProps> = ({ pageKey }) => {
  const pageData = pagesContent[pageKey];
  const router = useRouter();

  if (!pageData) {
    return (
      <LayoutSelector layoutType="main">
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Page Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400">The requested page could not be found.</p>
          </div>
        </div>
      </LayoutSelector>
    );
  }

  // Get icon based on page type
  const getPageIcon = (key: string) => {
    switch (key.toLowerCase()) {
      case 'about':
        return <Info className="w-6 h-6" />;
      case 'license':
        return <FileText className="w-6 h-6" />;
      case 'privacypolicy':
        return <Shield className="w-6 h-6" />;
      case 'termsofusage':
        return <FileText className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  // Get page metadata
  const lastUpdated = pageData.lastUpdated || new Date().toISOString();
  const readingTime = Math.ceil((pageData.content.replace(/<[^>]*>/g, '').length / 1000) * 4); // ~250 words per minute

  return (
    <LayoutSelector layoutType="main">
      <div className="min-h-[calc(100vh-200px)]">
        {/* Top Section with Back Button & Header */}
        <div className="mt-16 relative bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
          
          <div className="relative max-w-4xl mx-auto px-6 py-12">
            {/* Back Button */}
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>

            {/* Page Header */}
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="text-blue-600 dark:text-blue-400">
                  {getPageIcon(pageKey as string)}
                </div>
              </div>
              
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                  {pageData.title}
                </h1>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Updated {new Date(lastUpdated).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{readingTime} min read</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section (second section design applied here) */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-sm">
            <div className="px-8 py-8">
              <div 
                className={`
                  prose prose-lg dark:prose-invert max-w-none
                  prose-headings:text-gray-900 dark:prose-headings:text-white
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h1:text-3xl prose-h1:mb-8 prose-h1:mt-12 first:prose-h1:mt-0
                  prose-h2:text-2xl prose-h2:mb-6 prose-h2:mt-10 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-gray-700
                  prose-h3:text-xl prose-h3:mb-4 prose-h3:mt-8
                  prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
                  prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
                  prose-ul:mb-6 prose-ol:mb-6
                  prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:mb-2
                  prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20
                  prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:my-6 prose-blockquote:rounded-r-lg
                  prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 
                  prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                  prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-lg
                  prose-table:w-full prose-table:border-collapse prose-table:border prose-table:border-gray-200 dark:prose-table:border-gray-700
                  prose-th:border prose-th:border-gray-200 dark:prose-th:border-gray-700 prose-th:bg-gray-50 dark:prose-th:bg-gray-800 
                  prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold
                  prose-td:border prose-td:border-gray-200 dark:prose-td:border-gray-700 prose-td:px-4 prose-td:py-3
                `}
                dangerouslySetInnerHTML={{ __html: pageData.content }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles for Grid Background */}
      <style jsx>{`
        .bg-grid-slate-100 {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(148 163 184 / 0.05)'%3e%3cpath d='m0 .5h32m-32 32v-32'/%3e%3c/svg%3e");
        }
        .bg-grid-slate-700\/25 {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(55 65 81 / 0.25)'%3e%3cpath d='m0 .5h32m-32 32v-32'/%3e%3c/svg%3e");
        }
      `}</style>
    </LayoutSelector>
  );
};

export default GenericPage;
