import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EmailVerification() {
  const { user, isEmailVerified, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // If email is verified, redirect to dashboard
    if (isEmailVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [isEmailVerified, navigate]);

  const handleResend = async () => {
    const { error } = await resendVerificationEmail();
    if (error) {
      toast({
        title: 'Could not send email',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Email sent',
        description: 'Please check your inbox for the verification link.',
      });
    }
  };

  if (isEmailVerified) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Verify your email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-secondary text-center">
            We sent a verification link to <strong>{user?.email}</strong>
          </p>
          <p className="text-sm text-secondary text-center">
            Please check your inbox and click the link to verify your email address.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleResend}
              variant="outline"
              className="w-full h-7"
            >
              Resend verification email
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="w-full h-7 text-sm"
            >
              I'll verify later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
