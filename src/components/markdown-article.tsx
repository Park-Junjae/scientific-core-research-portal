import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownArticle({ markdown }: { markdown: string }) {
  return (
    <article className="prose-article">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </article>
  );
}
