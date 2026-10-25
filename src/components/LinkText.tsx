import React from 'react';
import { splitLinks } from '../utils/linkify.ts';

interface LinkTextProps {
  text: string;
  /** Called with the full address when a link is tapped (the app asks before opening it) */
  onOpenLink: (href: string) => void;
  /** Settings > Tappable links in messages. Off: the text is shown exactly as written, with no links. */
  enabled?: boolean;
}

/** Message text in which web links are tappable. Everything else is shown exactly as written. */
export const LinkText: React.FC<LinkTextProps> = ({ text, onOpenLink, enabled = true }) => {
  if (!enabled) return <>{text}</>;
  const parts = splitLinks(text);
  if (parts.length === 1 && !parts[0].href) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        part.href ? (
          <a
            key={i}
            href={part.href}
            // the app shows a "Open this link?" prompt instead of leaving straight away
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenLink(part.href as string);
            }}
            className="underline underline-offset-2 decoration-1 text-m3-primary dark:text-m3-primary-light break-all"
          >
            {part.text}
          </a>
        ) : (
          <React.Fragment key={i}>{part.text}</React.Fragment>
        )
      )}
    </>
  );
};
