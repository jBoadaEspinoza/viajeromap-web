import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import ActivityDetail from '../pages/ActivityDetail';
import Search from '../pages/Search';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import CapturePayment from '../pages/CapturePayment';
import CancelPayment from '../pages/CancelPayment';
import PaymentCompleted from '../pages/PaymentCompleted';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/activity/:id" element={<ActivityDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/capture-payment" element={<CapturePayment />} />
      <Route path="/cancel-payment" element={<CancelPayment />} />
      <Route path="/payment-completed" element={<PaymentCompleted />} />
    </Routes>
  );
};

export default AppRoutes; 