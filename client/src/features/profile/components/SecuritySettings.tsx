"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ShieldCheck, Key } from 'lucide-react';
import { useProfile, useUpdateProfile } from '../hooks';

export function SecuritySettings() {
  const { data: response } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const user = response?.data;

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
      payload: { password }
    }, {
      onSuccess: () => {
        setMessage('Password updated successfully');
        setPassword('');
        setConfirmPassword('');
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
            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Confirm Password</label>
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
            disabled={isPending || !password}
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
