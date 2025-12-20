'use client'

import { useActionState } from 'react'
import { updatePassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function UpdatePasswordPage() {
    const [state, formAction, isPending] = useActionState(updatePassword, null)

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Update Your Password</CardTitle>
                    <CardDescription>
                        For your security, you must set a new password before continuing.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        {state?.error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{state.error}</AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input 
                                id="password" 
                                name="password" 
                                type="password" 
                                required 
                                minLength={6}
                                placeholder="Enter at least 6 characters"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input 
                                id="confirmPassword" 
                                name="confirmPassword" 
                                type="password" 
                                required 
                                minLength={6}
                                placeholder="Re-enter your password"
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                </CardContent>
                <div className="border-t p-4 text-center">
                    <form action="/auth/signout" method="post">
                        <Button variant="ghost" size="sm" type="submit">
                            Sign Out
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    )
}
