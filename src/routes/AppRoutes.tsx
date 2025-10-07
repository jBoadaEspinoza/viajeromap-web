import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import TestHome from '../pages/TestHome';
import Search from '../pages/Search';
import ActivityDetail from '../pages/ActivityDetail';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/test-home" element={<TestHome />} />
      <Route path="/search" element={<Search />} />
      <Route path="/activity/:id" element={<ActivityDetail />} />
    </Routes>
  );
};

export default AppRoutes; 