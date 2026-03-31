'use client'
import { useState, useEffect } from 'react'

export interface FloorTable {
  id: string
  name: string
  capacity: number
  section: 'restaurant' | 'workspace'
  status: 'free' | 'reserved' | 'occupied'
  features: string[]
  x: number
  y: number
  width: number
  height: number
  shape: 'rect' | 'round'
}

interface FloorMapProps {
  section: 'restaurant' | 'workspace'
  selectedId: string | null
  onSelect: (table: FloorTable) => void
  date?: string
  timeSlot?: string
}

const RESTAURANT_LAYOUT: Omit<FloorTable, 'status'>[] = [
  { id: 'T-01', name: 'T-01', capacity: 2, section: 'restaurant', features: ['window'], x: 60,  y: 55,  width: 52, height: 52, shape: 'round' },
  { id: 'T-02', name: 'T-02', capacity: 2, section: 'restaurant', features: ['window'], x: 140, y: 55,  width: 52, height: 52, shape: 'round' },
  { id: 'T-03', name: 'T-03', capacity: 4, section: 'restaurant', features: ['window'], x: 225, y: 45,  width: 68, height: 68, shape: 'rect' },
  { id: 'T-04', name: 'T-04', capacity: 4, section: 'restaurant', features: ['window'], x: 320, y: 45,  width: 68, height: 68, shape: 'rect' },
  { id: 'T-05', name: 'T-05', capacity: 2, section: 'restaurant', features: [],         x: 60,  y: 170, width: 52, height: 52, shape: 'round' },
  { id: 'T-06', name: 'T-06', capacity: 4, section: 'restaurant', features: [],         x: 150, y: 165, width: 70, height: 70, shape: 'rect' },
  { id: 'T-07', name: 'T-07', capacity: 6, section: 'restaurant', features: [],         x: 250, y: 155, width: 90, height: 80, shape: 'rect' },
  { id: 'T-08', name: 'T-08', capacity: 4, section: 'restaurant', features: [],         x: 365, y: 165, width: 70, height: 70, shape: 'rect' },
  { id: 'T-09', name: 'T-09', capacity: 6, section: 'restaurant', features: ['private'], x: 55,  y: 295, width: 90, height: 75, shape: 'rect' },
  { id: 'T-10', name: 'T-10', capacity: 8, section: 'restaurant', features: ['private'], x: 175, y: 295, width: 110, height: 80, shape: 'rect' },
  { id: 'T-11', name: 'T-11', capacity: 4, section: 'restaurant', features: [],         x: 318, y: 295, width: 72, height: 72, shape: 'rect' },
  { id: 'T-12', name: 'T-12', capacity: 2, section: 'restaurant', features: ['outdoor'], x: 430, y: 55,  width: 52, height: 52, shape: 'round' },
  { id: 'T-13', name: 'T-13', capacity: 2, section: 'restaurant', features: ['outdoor'], x: 430, y: 135, width: 52, height: 52, shape: 'round' },
]

const WORKSPACE_LAYOUT: Omit<FloorTable, 'status'>[] = [
  { id: 'WS-01', name: 'Desk 01', capacity: 1, section: 'workspace', features: ['window', 'outlet'], x: 55,  y: 50,  width: 80, height: 55, shape: 'rect' },
  { id: 'WS-02', name: 'Desk 02', capacity: 1, section: 'workspace', features: ['window', 'outlet'], x: 160, y: 50,  width: 80, height: 55, shape: 'rect' },
  { id: 'WS-03', name: 'Desk 03', capacity: 1, section: 'workspace', features: ['window', 'outlet'], x: 265, y: 50,  width: 80, height: 55, shape: 'rect' },
  { id: 'WS-04', name: 'Quiet 04', capacity: 1, section: 'workspace', features: ['quiet', 'outlet'],  x: 55,  y: 165, width: 80, height: 55, shape: 'rect' },
  { id: 'WS-05', name: 'Quiet 05', capacity: 1, section: 'workspace', features: ['quiet', 'outlet'],  x: 160, y: 165, width: 80, height: 55, shape: 'rect' },
  { id: 'WS-06', name: 'Stand 06', capacity: 1, section: 'workspace', features: ['standing', 'outlet'], x: 370, y: 50,  width: 80, height: 55, shape: 'rect' },
  { id: 'WS-07', name: 'Stand 07', capacity: 1, section: 'workspace', features: ['standing', 'outlet'], x: 370, y: 165, width: 80, height: 55, shape: 'rect' },
  { id: 'WS-POD-A', name: 'Pod A', capacity: 4, section: 'workspace', features: ['meeting', 'tv', 'outlet'], x: 55,  y: 280, width: 120, height: 85, shape: 'rect' },
  { id: 'WS-POD-B', name: 'Pod B', capacity: 4, section: 'workspace', features: ['meeting', 'tv', 'outlet'], x: 220, y: 280, width: 120, height: 85, shape: 'rect' },
]

const FEATURE_ICONS: Record<string, string> = {
  window: '🪟', private: '🔒', outdoor: '🌿', quiet: '🔕',
  standing: '↕', meeting: '👥', tv: '📺', outlet: '⚡',
}

const STATUS_FILL: Record<string, string> = {
  free:     '#15803D',
  reserved: '#D97706',
  occupied: '#B91C1C',
}
const STATUS_FILL_HOVER = '#1A9E50'
const STATUS_FILL_SELECTED = '#F59E0B'

export default function FloorMap({ section, selectedId, onSelect, date, timeSlot }: FloorMapProps) {
  const [tables, setTables] = useState<FloorTable[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ table: FloorTable; x: number; y: number } | null>(null)

  const layout = section === 'restaurant' ? RESTAURANT_LAYOUT : WORKSPACE_LAYOUT
  const viewBox = section === 'restaurant' ? '0 0 510 415' : '0 0 510 410'

  useEffect(() => {
    const fetchStatuses = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ section })
        if (date) params.set('date', date)
        if (timeSlot) params.set('timeSlot', timeSlot)
        
        const res = await fetch(`/api/tables/availability?${params}`)
        if (!res.ok) throw new Error('API Error')
        
        const data = await res.json()
        const statusMap: Record<string, 'free' | 'reserved' | 'occupied'> = data.success ? data.data : {}

        setTables(
          layout.map((t) => ({
            ...t,
            status: statusMap[t.id] ?? 'free',
          }))
        )
      } catch {
        setTables(layout.map((t) => ({ ...t, status: 'free' as const })))
      }
      setLoading(false)
    }
    fetchStatuses()
  }, [section, date, timeSlot])

  // 🛡️ User Alert Feedback for Occupied Tables
  const handleClick = (table: FloorTable) => {
    if (table.status === 'occupied' || table.status === 'reserved') {
      alert(`Sorry! ${table.name} is already booked for ${timeSlot}. Please select a green table.`)
      return
    }
    onSelect(table)
  }

  const getFill = (table: FloorTable) => {
    if (table.id === selectedId) return STATUS_FILL_SELECTED
    if (table.id === hoveredId && table.status === 'free') return STATUS_FILL_HOVER
    return STATUS_FILL[table.status]
  }

  const getOpacity = (table: FloorTable) => {
    if (table.status === 'occupied') return 0.5
    if (table.status === 'reserved' && table.id !== selectedId) return 0.7
    return 1
  }

  if (loading) {
    return (
      <div className="w-full h-80 bg-stone-900 rounded-2xl border border-stone-700 flex items-center justify-center">
        <div className="text-stone-500 text-sm animate-pulse">Scanning live availability...</div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {[
          { color: '#15803D', label: 'Available' },
          { color: '#D97706', label: 'Reserved' },
          { color: '#B91C1C', label: 'Occupied' },
          { color: '#F59E0B', label: 'Your selection' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2 text-xs text-stone-400">
            <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      <div className="bg-[#F5F0E8] rounded-2xl overflow-hidden border border-stone-300 shadow-xl relative">
        <svg viewBox={viewBox} className="w-full" style={{ maxHeight: 420, background: 'transparent' }}>
          <rect x="0" y="0" width="510" height="415" fill="#EDE8DE" rx="0"/>

          {/* ... Background Walls & Assets remain exactly the same ... */}
          {section === 'restaurant' && (
            <>
              <rect x="30" y="25" width="450" height="370" fill="none" stroke="#C5B99A" strokeWidth="3" rx="4"/>
              <rect x="390" y="25" width="90" height="100" fill="#DDD8C8" stroke="#C5B99A" strokeWidth="1.5"/>
              <text x="435" y="80" textAnchor="middle" fill="#9D9485" fontSize="9" fontFamily="system-ui">KITCHEN</text>
              <rect x="390" y="150" width="90" height="50" fill="#DDD8C8" stroke="#C5B99A" strokeWidth="1.5" rx="3"/>
              <text x="435" y="180" textAnchor="middle" fill="#9D9485" fontSize="9" fontFamily="system-ui">BAR</text>
              <rect x="200" y="390" width="80" height="8" fill="#C5B99A" rx="2"/>
              <text x="240" y="408" textAnchor="middle" fill="#9D9485" fontSize="8" fontFamily="system-ui">ENTRANCE</text>
              <rect x="30" y="25" width="350" height="5" fill="#93C5FD" opacity="0.4" rx="1"/>
              <text x="55" y="22" fill="#93C5FD" fontSize="7" fontFamily="system-ui" opacity="0.8">WINDOW →</text>
              <rect x="408" y="28" width="68" height="155" fill="none" stroke="#B5E7A0" strokeWidth="1.5" strokeDasharray="4,3"/>
              <text x="442" y="240" textAnchor="middle" fill="#86EFAC" fontSize="8" fontFamily="system-ui">PATIO</text>
            </>
          )}

          {tables.map((table) => {
            const fill = getFill(table)
            const opacity = getOpacity(table)
            const isSelected = table.id === selectedId
            const cx = table.x + table.width / 2
            const cy = table.y + table.height / 2
            const r = Math.min(table.width, table.height) / 2

            return (
              <g
                key={table.id}
                style={{ cursor: table.status === 'free' ? 'pointer' : 'not-allowed', opacity }}
                onClick={() => handleClick(table)}
                onMouseEnter={(e) => {
                  setHoveredId(table.id)
                  const rect = (e.currentTarget as SVGGElement).getBoundingClientRect()
                  setTooltip({ table, x: rect.left, y: rect.top })
                }}
                onMouseLeave={() => { setHoveredId(null); setTooltip(null) }}
              >
                {/* 🪑 SEAT NUMBERING FOR ROUND TABLES */}
                {table.shape === 'round' && Array.from({ length: table.capacity }).map((_, i) => {
                  const angle = (i / table.capacity) * 2 * Math.PI - Math.PI / 2
                  const chairR = r + 10
                  const chairX = cx + chairR * Math.cos(angle)
                  const chairY = cy + chairR * Math.sin(angle)
                  return (
                    <g key={i}>
                      <circle cx={chairX} cy={chairY} r={7} fill={fill} opacity={0.7} />
                      <text x={chairX} y={chairY + 2.5} textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">{i + 1}</text>
                    </g>
                  )
                })}

                {/* 🪑 SEAT NUMBERING FOR RECTANGLE TABLES */}
                {table.shape === 'rect' && (
                  <>
                    {/* Top Chairs */}
                    {Array.from({ length: Math.floor(table.capacity / 2) }).map((_, i) => {
                      const chairX = table.x + 10 + i * (table.width / Math.floor(table.capacity / 2)) - 2
                      const chairY = table.y - 12
                      return (
                        <g key={`t${i}`}>
                          <rect x={chairX} y={chairY} width={16} height={12} rx={2} fill={fill} opacity={0.7}/>
                          <text x={chairX + 8} y={chairY + 9} textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">{i + 1}</text>
                        </g>
                      )
                    })}
                    {/* Bottom Chairs */}
                    {Array.from({ length: Math.ceil(table.capacity / 2) }).map((_, i) => {
                      const chairX = table.x + 10 + i * (table.width / Math.ceil(table.capacity / 2)) - 2
                      const chairY = table.y + table.height + 1
                      return (
                        <g key={`b${i}`}>
                          <rect x={chairX} y={chairY} width={16} height={12} rx={2} fill={fill} opacity={0.7}/>
                          <text x={chairX + 8} y={chairY + 9} textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">{Math.floor(table.capacity / 2) + i + 1}</text>
                        </g>
                      )
                    })}
                  </>
                )}

                {/* Table surface */}
                {table.shape === 'round' ? (
                  <>
                    <circle cx={cx} cy={cy} r={r} fill={fill} />
                    {isSelected && <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="5,3"/>}
                  </>
                ) : (
                  <>
                    <rect x={table.x} y={table.y} width={table.width} height={table.height} rx={6} fill={fill} />
                    {isSelected && <rect x={table.x - 4} y={table.y - 4} width={table.width + 8} height={table.height + 8} rx={8} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="5,3"/>}
                  </>
                )}

                <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">
                  {table.name.replace('WS-', '').replace('Desk ', 'D').replace('Quiet ', 'Q').replace('Stand ', 'S').replace('Pod ', 'P')}
                </text>
              </g>
            )
          })}
        </svg>

        {/* 🛡️ EXPLICIT HOVER TOOLTIP */}
        {tooltip && (
          <div className="pointer-events-none absolute bottom-4 left-4 bg-stone-900 text-stone-100 text-xs rounded-xl px-4 py-3 shadow-xl border border-stone-700 min-w-[160px]">
            <p className="font-bold text-amber-400 mb-1">{tooltip.table.name}</p>
            
            {/* Show exact remaining capacity */}
            <p className="text-stone-300 border-b border-stone-700 pb-2 mb-2">
              🪑 <span className="font-bold text-white">{tooltip.table.status === 'free' ? tooltip.table.capacity : 0}</span> / {tooltip.table.capacity} seats available
            </p>

            <p className={`font-semibold ${
              tooltip.table.status === 'free' ? 'text-green-400' :
              tooltip.table.status === 'reserved' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {tooltip.table.status === 'free' ? '✓ Available to book' :
               tooltip.table.status === 'reserved' ? '⏳ Already Reserved' : '✗ Currently Occupied'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}