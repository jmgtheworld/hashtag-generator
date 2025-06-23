// components/PostContent.tsx

export default function PostContent({ content }: { content: string }) {
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded whitespace-pre-wrap">
      <h2 className="font-semibold mb-2">Generated Instagram Post</h2>
      <p>{content}</p>
    </div>
  );
}
