// src/components/AdminRoute.js
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;

  return children;
};

export default AdminRoute;
