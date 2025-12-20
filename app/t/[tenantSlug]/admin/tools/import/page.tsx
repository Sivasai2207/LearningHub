'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { importContent } from './actions'
import { toast } from 'sonner'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

export default function ImportPage() {
    const [json, setJson] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handleImport = async () => {
        if (!json.trim()) return
        
        setLoading(true)
        setResult(null)
        
        const res = await importContent(json)
        
        setLoading(false)
        
        if (res.error) {
            toast.error('Import Failed')
            setResult({ error: res.error })
        } else {
            toast.success('Import Successful')
            setResult({ success: true, stats: res.stats })
            setJson('')
        }
    }

    return (
        <div className="space-y-6 max-w-4xl">
             <div>
                 <h1 className="text-3xl font-bold tracking-tight">Bulk Import</h1>
                 <p className="text-gray-500">Import courses, modules, and content via JSON.</p>
            </div>

            <div className="grid gap-6">
                <div className="space-y-2">
                    <Label>JSON Data</Label>
                    <Textarea 
                        placeholder='{ "courses": [ ... ] }' 
                        className="font-mono h-[300px]"
                        value={json}
                        onChange={e => setJson(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Structure: {`{ "courses": [{ "title": "...", "modules": [{ "title": "...", "content": [...] }] }] }`}
                    </p>
                </div>

                {result && (
                    <Alert variant={result.error ? "destructive" : "default"} className={result.success ? "border-green-500 bg-green-50 text-green-900" : ""}>
                         <AlertTitle>{result.error ? "Error" : "Success"}</AlertTitle>
                         <AlertDescription>
                            {result.error || `Imported ${result.stats.courses} courses, ${result.stats.modules} modules, ${result.stats.items} items.`}
                         </AlertDescription>
                    </Alert>
                )}

                <Button onClick={handleImport} disabled={loading || !json.trim()}>
                    {loading ? 'Importing...' : 'Run Import'}
                </Button>
            </div>
        </div>
    )
}
