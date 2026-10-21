import React from 'react';
import { User } from 'lucide-react';

interface ProfileAvatarProps {
  photo?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

/** Round profile picture; falls back to the first letter of the name, or a person icon. */
export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ photo, name, size = 40, className = '' }) => {
  const initial = name && name.trim() ? name.trim()[0].toUpperCase() : '';
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-m3-primary-container dark:bg-m3-primary-deep text-m3-primary dark:text-m3-primary-light ${className}`}
    >
      {photo ? (
        <img src={photo} alt="" className="w-full h-full object-cover" draggable={false} />
      ) : initial ? (
        <span className="font-semibold" style={{ fontSize: size * 0.42 }}>
          {initial}
        </span>
      ) : (
        <User style={{ width: size * 0.52, height: size * 0.52 }} />
      )}
    </div>
  );
};
