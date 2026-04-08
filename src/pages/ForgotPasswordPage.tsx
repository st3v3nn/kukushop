import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/ui/Logo';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error('Please enter your email');
            return;
        }

        setIsLoading(true);
        try {
            await api.forgotPassword(email.trim());
            setIsSent(true);
            toast.success('Reset email sent!');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <h2 className="text-xl font-bold mb-2">Check Your Email</h2>
                        <p className="text-muted-foreground mb-2">
                            If an account exists for <strong>{email}</strong>, we've sent a password reset link.
                        </p>
                        <p className="text-sm text-muted-foreground mb-6">
                            The link expires in 1 hour. Check your spam folder if you don't see it.
                        </p>
                        <div className="space-y-3">
                            <Button onClick={() => setIsSent(false)} variant="outline" className="w-full">
                                Try Another Email
                            </Button>
                            <Button onClick={() => navigate('/login')} className="w-full">
                                Back to Login
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-4">
                        <Logo size="lg" />
                    </div>
                    <CardTitle className="text-xl">Forgot Password?</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Enter your email and we'll send you a link to reset your password
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="pl-10 h-12"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Send Reset Link
                        </Button>

                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 inline-block mr-1" />
                            Back to Login
                        </button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ForgotPasswordPage;
