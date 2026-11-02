// app/faq/page.tsx
import FAQClient from "./client";
import faqData from "@/components/faq-data.json";

export default function FAQPage() {
  return <FAQClient data={faqData} />;
}
