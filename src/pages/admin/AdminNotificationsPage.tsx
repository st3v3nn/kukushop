import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users, User, Bike, Bell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export const AdminNotificationsPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        targetRole: 'all',
        title: '',
        message: '',
    });

    const roles = [
        { id: 'all', label: 'Everyone', icon: Users, color: 'bg-primary/10 text-primary' },
        { id: 'customer', label: 'Customers', icon: User, color: 'bg-blue-500/10 text-blue-500' },
        { id: 'rider', label: 'Riders', icon: Bike, color: 'bg-green-500/10 text-green-500' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.message) {
            toast.error('Title and message are required');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.broadcastNotification(formData);
            toast.success('Broadcast sent successfully!');
            setFormData({ ...formData, title: '', message: '' });
        } catch (error) {
            console.error('Failed to send broadcast:', error);
            toast.error('Failed to send broadcast notification');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 flex items-center gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-semibold">Broadcast Notification</h1>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-8 p-6 rounded-2xl bg-card border shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-full bg-primary/10">
                            <Bell className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">New Broadcast</h2>
                            <p className="text-sm text-muted-foreground text-pretty">
                                Send a push notification to all users matching the selected role.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Target Role Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Recipient Group</label>
                            <div className="grid grid-cols-3 gap-3">
                                {roles.map((role) => {
                                    const Icon = role.icon;
                                    const isActive = formData.targetRole === role.id;
                                    return (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, targetRole: role.id })}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                                                isActive
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                    : "bg-background hover:border-primary/50"
                                            )}
                                        >
                                            <div className={cn("p-2 rounded-lg", role.color)}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <span className={cn("text-xs font-medium", isActive && "text-primary")}>
                                                {role.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <label htmlFor="title" className="text-sm font-medium">Notification Title</label>
                            <Input
                                id="title"
                                placeholder="e.g., Weekend Special! 🍟"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                className="rounded-xl h-12"
                            />
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <label htmlFor="message" className="text-sm font-medium">Message Body</label>
                            <Textarea
                                id="message"
                                placeholder="Write your message here..."
                                rows={4}
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                required
                                className="rounded-xl resize-none"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl text-base font-bold gap-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                            ) : (
                                <>
                                    <Send className="h-5 w-5" />
                                    Send Broadcast
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                {/* Preview Card */}
                <div className="space-y-3 opacity-80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Preview</h3>
                    <div className="p-4 rounded-2xl border bg-primary/5 border-primary/20 flex gap-4">
                        <div className="p-2 rounded-lg bg-primary/10 self-start">
                            <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-bold truncate">
                                    {formData.title || "Notification Title"}
                                </h4>
                                <span className="text-[10px] text-muted-foreground italic">Just now</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                {formData.message || "The message content will appear here..."}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminNotificationsPage;
