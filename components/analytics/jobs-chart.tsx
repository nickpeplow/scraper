'use client'

import { format } from 'date-fns'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'

interface JobsChartProps {
  data: {
    date: string
    count: number
    completed: number
    failed: number
  }[]
}

export function JobsChart({ data }: JobsChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    date: format(new Date(item.date), 'MMM dd'),
  }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={formattedData}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
          }}
        />
        <Legend 
          verticalAlign="top" 
          height={36}
          iconType="line"
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorTotal)"
          strokeWidth={2}
          name="Total Jobs"
        />
        <Area
          type="monotone"
          dataKey="completed"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorCompleted)"
          strokeWidth={2}
          name="Completed"
        />
        <Area
          type="monotone"
          dataKey="failed"
          stroke="#ef4444"
          fillOpacity={1}
          fill="url(#colorFailed)"
          strokeWidth={2}
          name="Failed"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}