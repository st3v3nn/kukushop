import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Always redirect to splash screen on app start
    navigate('/splash', { replace: true });
  }, [navigate]);

  return null;
};

export default Index;
