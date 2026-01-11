import React from 'react';

const NotificationBadge = ({ count, className = "" }) => {
    if (!count || count === 0) return null;

    return (
        <span
            className={`absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce shadow-lg min-w-[16px] text-center ${className}`}
        >
            {count > 99 ? '99+' : count}
        </span>
    );
};

export default NotificationBadge;
