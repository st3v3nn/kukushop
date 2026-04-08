import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: ('customer' | 'rider' | 'admin')[];
    redirectTo?: string;
}

export const ProtectedRoute = ({
    children,
    allowedRoles,
    redirectTo = '/login'
}: ProtectedRouteProps) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                // Redirect to unified login page
                navigate('/login', {
                    state: { from: location.pathname },
                    replace: true
                });
            } else if (allowedRoles && user && !allowedRoles.includes(user.role as any)) {
                // Redirect if role is not allowed
                if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
                else if (user.role === 'rider') navigate('/rider/dashboard', { replace: true });
                else navigate('/', { replace: true });
            }
        }
    }, [isLoading, isAuthenticated, user, allowedRoles, navigate, location.pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingSpinner />
            </div>
        );
    }

    // Double check auth and role before rendering children to prevent flicker
    if (!isAuthenticated) return null;
    if (allowedRoles && user && !allowedRoles.includes(user.role as any)) return null;

    return <>{children}</>;
};

export default ProtectedRoute;
