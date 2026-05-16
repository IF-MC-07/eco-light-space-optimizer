"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { UserCircle2, Save } from 'lucide-react';
import { useProfile, useUpdateProfile } from '../hooks';

export function AccountDetails() {
  const { data: response, isLoading } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  
  const user = response?.data;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleUpdate = () => {
    if (!user) return;
    updateProfile({
      id: user.user_id,
      payload: { name, email }
    });
  };

  if (isLoading) return <div>Loading account details...</div>;

  return (
    <Card className="h-full border-transparent bg-[#F5F7F5] shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCircle2 className="w-5 h-5 text-primary-dark" />
          <CardTitle className="text-lg font-bold text-black font-heading">Account Details</CardTitle>
        </div>
        <Button 
          size="sm" 
          onClick={handleUpdate} 
          disabled={isPending}
          className="bg-primary-dark hover:bg-primary text-white flex items-center gap-2"
        >
          <Save size={14} />
          {isPending ? 'Saving...' : 'Save'}
        </Button>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Full Name</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="bg-white border-neutral-border font-medium text-black focus:ring-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Email Address</label>
            <Input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border-neutral-border font-medium text-black focus:ring-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Role</label>
            <Input 
              value={user?.role} 
              readOnly
              className="bg-neutral-border/30 border-none font-medium text-black focus:ring-0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
