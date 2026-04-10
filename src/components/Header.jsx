import React from 'react';
import { Book } from 'lucide-react';

const Header = () => {
  return (
    <header className="header">
      <h1><Book size={36} color="#3b82f6" /> 성경통독 진도표</h1>
      <p>매일 꾸준히 말씀을 읽으며 영적인 성장을 이뤄보세요.</p>
    </header>
  );
};

export default Header;
