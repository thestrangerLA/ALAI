
'use client';

import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn, User as UserIcon } from 'lucide-react';

export function UserButton() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  if (isUserLoading) {
    return <Button variant="outline" size="icon" disabled><UserIcon className="h-4 w-4" /></Button>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm hidden sm:inline">
            {user.isAnonymous ? "Anonymous User" : user.email}
        </span>
        <Button variant="outline" size="icon" onClick={() => auth?.signOut()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => auth?.signInAnonymously()}>
      <LogIn className="mr-2 h-4 w-4" />
      Sign In
    </Button>
  );
}
