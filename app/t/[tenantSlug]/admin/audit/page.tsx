import { createClient } from '@/lib/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Simple type for display
type AuditLog = {
    id: string
    action: string
    entity_type: string
    entity_id: string
    actor_email: string
    created_at: string
    metadata: any
}

export default async function AuditPage() {
    const supabase = await createClient()
    
    // Fetch logs (limit 50 for now)
    const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

    return (
        <div className="space-y-6">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                 <p className="text-gray-500">View system activity and changes.</p>
            </div>
            
            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Actor</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(logs as AuditLog[] || []).map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                    {new Date(log.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-sm">{log.actor_email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{log.action}</Badge>
                                </TableCell>
                                <TableCell className="text-sm capitalize">
                                    {log.entity_type}
                                    <span className="block text-xs text-muted-foreground font-mono truncate w-24">
                                        {log.entity_id}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <pre className="text-xs text-gray-500 overflow-x-auto max-w-[200px]">
                                        {log.metadata ? JSON.stringify(log.metadata, null, 2) : '-'}
                                    </pre>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!logs || logs.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                    No logs found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
