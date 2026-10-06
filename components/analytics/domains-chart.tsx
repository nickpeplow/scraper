'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'

interface DomainsChartProps {
  data: {
    domain: string
    count: number
    completed: number
    failed: number
  }[]
}

export function DomainsChart({ data }: DomainsChartProps) {
  const formattedData = data.slice(0, 10).map(item => ({
    ...item,
    domain: item.domain || 'Unknown',
    successRate: item.count > 0 ? Math.round((item.completed / item.count) * 100) : 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart 
        data={formattedData}
        layout="horizontal"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          type="number"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          type="category"
          dataKey="domain"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={90}
          tick={{ fontSize: 11 }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'Success Rate') {
              return [`${value}%`, name]
            }
            return [value.toLocaleString(), name]
          }}
        />
        <Legend 
          verticalAlign="top" 
          height={36}
        />
        <Bar 
          dataKey="completed" 
          fill="#10b981" 
          name="Completed"
          stackId="a"
        />
        <Bar 
          dataKey="failed" 
          fill="#ef4444" 
          name="Failed"
          stackId="a"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}