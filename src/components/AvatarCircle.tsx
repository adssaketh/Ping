import React from 'react';

interface AvatarCircleProps {
  /** Profile picture (data URL) when the contact has one; otherwise the initials are shown */
  photo?: string;
  className: string;
  children: React.ReactNode;
}

/** Round avatar: the contact's picture if there is one, else coloured initials. */
export const AvatarCircle: React.FC<AvatarCircleProps> = ({ photo, className, children }) => (
  <div
    className={className}
    style={photo ? { backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
  >
    {photo ? null : children}
  </div>
);
