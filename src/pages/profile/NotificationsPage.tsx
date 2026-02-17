import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';

export const NotificationsPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background pb-8">
            {/* Header */}
            <header className="sticky top-0 z-40 flex items-center gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-semibold">Notifications</h1>
            </header>

            <main className="px-4 py-16 flex flex-col items-center justify-center text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Bell className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No notifications yet</h3>
                <p className="text-muted-foreground">
                    We'll let you know when there are updates about your orders.
                </p>
            </main>
        </div>
    );
};

export default NotificationsPage;
