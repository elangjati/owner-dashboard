import { LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  color: string
  textColor: string
  loading?: boolean
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  textColor,
  loading,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className={cn('text-2xl font-bold mt-2', loading ? 'animate-pulse' : '')}>
            {loading ? '...' : value}
          </p>
        </div>
        <div className={cn('p-3 rounded-lg', color)}>
          <Icon size={24} className={textColor} />
        </div>
      </div>
    </div>
  )
}
