import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import TestHome from '../pages/TestHome';
import ActivityDetail from '../pages/ActivityDetail';
import Search from '../pages/Search';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/test-home" element={<TestHome />} />
      <Route path="/activity/:id" element={<ActivityDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
    </Routes>
  );
};

export default AppRoutes; 