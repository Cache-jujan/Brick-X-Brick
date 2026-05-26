import { Activity, Database, Server, Users, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Button, Card } from '../components/ui/Library'

const NODES = [
  { id: 1, name: 'Validator-1', ip: '10.0.0.1', status: 'Online',  block: '#88,241', sync: 'Synced' },
  { id: 2, name: 'Validator-2', ip: '10.0.0.2', status: 'Online',  block: '#88,241', sync: 'Synced' },
  { id: 3, name: 'Validator-3', ip: '10.0.0.3', status: 'Offline', block: '#88,198', sync: '43 blocks behind' },
]

export default function Admin() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>System Administration</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Activity,  label: 'System Uptime',  value: '99.8%',   bg: 'rgba(62,200,122,0.1)',   color: '#3EC87A' },
          { icon: Database,  label: 'DB Size',        value: '2.4 GB',  bg: 'rgba(245,185,62,0.1)',   color: '#F5B93E' },
          { icon: Server,    label: 'Block Height',   value: '#88,241', bg: 'rgba(108,99,255,0.1)',   color: '#6C63FF' },
          { icon: Users,     label: 'Active Users',   value: '4',       bg: 'rgba(217,123,44,0.1)',   color: '#D97B2C' },
        ].map(({ icon: Icon, label, value, bg, color }) => (
          <Card key={label} className="flex items-center gap-4">
            <div className="p-3 rounded-full" style={{ backgroundColor: bg }}>
              <Icon size={24} style={{ color }} />
            </div>
            <div>
              <div className="text-sm" style={{ color: '#9A9590' }}>{label}</div>
              <div className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>{value}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blockchain nodes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Blockchain Nodes</h3>
            <Button size="sm" variant="ghost"><RefreshCw size={14} /></Button>
          </div>
          <table className="w-full text-sm text-left">
            <thead style={{ backgroundColor: '#1A1A1A', color: '#9A9590' }}>
              <tr>
                <th className="px-4 py-2">Node</th>
                <th className="px-4 py-2">IP</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Sync</th>
              </tr>
            </thead>
            <tbody>
              {NODES.map(node => (
                <tr key={node.id} style={{ borderTop: '1px solid #2E2E2E' }}>
                  <td className="px-4 py-3 font-medium">{node.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{node.ip}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{ color: node.status === 'Online' ? '#3EC87A' : '#E84B4B' }}
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: node.status === 'Online' ? '#3EC87A' : '#E84B4B' }}
                      />
                      {node.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#9A9590' }}>{node.sync}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Backups */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>System Backups</h3>
            <Button size="sm">Run Manual Backup</Button>
          </div>
          <div className="space-y-4">
            <div
              className="p-4 rounded-lg flex items-center justify-between"
              style={{ backgroundColor: 'rgba(62,200,122,0.1)', border: '1px solid rgba(62,200,122,0.2)' }}
            >
              <div>
                <div className="font-bold" style={{ color: '#3EC87A' }}>Last Backup Successful</div>
                <div className="text-sm">{new Date(Date.now() - 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — 2:00 AM</div>
              </div>
              <CheckCircle2 size={24} style={{ color: '#3EC87A' }} />
            </div>
            <div
              className="p-4 rounded-lg flex items-center justify-between"
              style={{ backgroundColor: '#1A1A1A', border: '1px solid #2E2E2E' }}
            >
              <div>
                <div className="font-bold" style={{ color: '#9A9590' }}>Next Scheduled</div>
                <div className="text-sm">{new Date(Date.now() + 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — 2:00 AM</div>
              </div>
              <span className="text-xs px-2 py-1 rounded" style={{ color: '#9A9590', backgroundColor: '#242424' }}>Daily</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}