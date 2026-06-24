"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ShieldCheck, Key } from 'lucide-react';
import { useProfile, useUpdateProfile } from '../hooks';
import { useForgotPassword } from '../../auth/hooks';

export function SecuritySettings() {
  const { data: response } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { mutate: forgotPassword, isPending: isForgotPending } = useForgotPassword();
  const user = response?.data;

  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleUpdatePassword = () => {
    if (!user) return;
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    updateProfile({
      id: user.user_id,
      payload: { old_password: oldPassword, password }
    }, {
      onSuccess: () => {
        setMessage('Password updated successfully');
        setOldPassword('');
        setPassword('');
        setConfirmPassword('');
      },
      onError: (error: any) => {
        setMessage(error?.response?.data?.message || 'Failed to update password');
      }
    });
  };

  const handleForgotPassword = () => {
    if (!user?.email) {
      setMessage('No email associated with this account');
      return;
    }
    forgotPassword({ email: user.email }, {
      onSuccess: () => {
        setMessage('Password reset email sent successfully');
      },
      onError: (error: any) => {
        setMessage(error?.response?.data?.message || 'Failed to send reset email');
      }
    });
  };

  return (
    <Card className="h-full border-transparent bg-[#F5F7F5] shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 flex flex-row items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary-dark" />
        <CardTitle className="text-lg font-bold text-black font-heading">Security Settings</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Old Password</label>
            <Input 
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter old password"
              className="bg-white border-neutral-border font-medium text-black"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">New Password</label>
            <Input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="bg-white border-neutral-border font-medium text-black"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Confirm Password</label>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                disabled={isForgotPending}
                className="text-[10px] font-bold text-primary hover:underline disabled:opacity-50"
              >
                {isForgotPending ? 'Sending...' : 'Forgot password?'}
              </button>
            </div>
            <Input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="bg-white border-neutral-border font-medium text-black"
            />
          </div>
          {message && <p className={`text-xs font-bold ${message.includes('success') ? 'text-primary' : 'text-tertiary'}`}>{message}</p>}
          <Button 
            onClick={handleUpdatePassword}
            disabled={isPending || !password || !oldPassword}
            className="w-full bg-primary-dark hover:bg-primary text-white flex items-center justify-center gap-2"
          >
            <Key size={14} />
            {isPending ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
