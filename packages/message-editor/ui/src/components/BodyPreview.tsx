import "./BodyPreview.css";

interface Props {
  body: string;
}

// Highlight {{token}} placeholders without resolving them
function renderWithHighlights(text: string): React.ReactNode[] {
  const parts = text.split(/({{[^}]+}})/g);
  return parts.map((part, i) => {
    if (/^{{.+}}$/.test(part)) {
      return <mark key={i} className="body-preview__token">{part}</mark>;
    }
    return part;
  });
}

export default function BodyPreview({ body }: Props) {
  if (!body.trim()) {
    return (
      <div className="body-preview body-preview--empty">
        Body preview will appear here…
      </div>
    );
  }

  return (
    <div className="body-preview">
      <div className="body-preview__label">Preview</div>
      <div className="body-preview__content">
        {renderWithHighlights(body)}
      </div>
    </div>
  );
}
