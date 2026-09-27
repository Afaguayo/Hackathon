import React from 'react';

interface UserAvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'lg';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, imageUrl, size = 'sm' }) => {
  const dimension = size === 'lg' ? 'w-24 h-24 text-3xl' : 'w-8 h-8 text-xs';
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={`${dimension} rounded-full object-cover border border-line flex-shrink-0`}
      />
    );
  }

  return (
    <span className={`${dimension} rounded-full bg-reed-soft text-ink flex items-center justify-center font-bold border border-line flex-shrink-0`}>
      {(name.trim().charAt(0) || 'R').toUpperCase()}
    </span>
  );
};
