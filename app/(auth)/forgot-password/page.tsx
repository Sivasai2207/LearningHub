'use client'

import { useActionState } from 'react'
import { requestPasswordReset } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export default function ForgotPasswordPage() {
    const [state, formAction, isPending] = useActionState(requestPasswordReset, null)

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email address to request a password reset.
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
                         {state?.message && !state?.error && (
                             <Alert className="border-green-200 bg-green-50 text-green-800">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertDescription>{state.message}</AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                                id="email" 
                                name="email" 
                                type="email" 
                                required 
                                placeholder="name@company.com"
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
                        Back to Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
