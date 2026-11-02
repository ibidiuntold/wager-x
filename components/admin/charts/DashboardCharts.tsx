import { memo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardChartsProps {
  recentActivity: {
    date: string;
    wagers: number;
    amount: number;
    activeUsers: number;
  }[];
  wagersByGame: { 
    name: string; 
    value: number 
  }[];
  hourlyActivity: {
    hour: number;
    wagers: number;
    users: number;
  }[];
  colors: string[];
}

// Individual chart components - memoized for performance
const ActivityChart = memo(function ActivityChart({ 
  data 
}: { 
  data: DashboardChartsProps['recentActivity'] 
}) {
  return (
    <Card className="relative overflow-hidden shadow-lg">
      <CardHeader>
        <CardTitle>Activity Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="wagerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--muted)",
                  borderRadius: "6px",
                  padding: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", marginBottom: "4px" }}
                formatter={(value, name) => [
                  value,
                  name === "wagers" ? "Total Wagers" : "Active Users"
                ]}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(value) => (
                  <span className="text-sm font-medium">
                    {value === "wagers" ? "Total Wagers" : "Active Users"}
                  </span>
                )}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="wagers"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#wagerGradient)"
                name="wagers"
                activeDot={{ r: 4, strokeWidth: 1 }}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="activeUsers"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                fill="url(#userGradient)"
                name="activeUsers"
                activeDot={{ r: 4, strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

const WagersByGameChart = memo(function WagersByGameChart({ 
  data, 
  colors 
}: { 
  data: DashboardChartsProps['wagersByGame'],
  colors: string[]
}) {
  return (
    <Card className="relative overflow-hidden shadow-lg">
      <CardHeader>
        <CardTitle>Wagers by Game</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
                animationBegin={0}
                animationDuration={1500}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]}
                    className="transition-all duration-200 hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--muted)",
                  borderRadius: "6px",
                  padding: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value, name) => [
                  `${value} wagers`,
                  name
                ]}
              />
              <Legend 
                verticalAlign="middle" 
                align="right"
                layout="vertical"
                formatter={(value, entry) => (
                  <span className="text-sm font-medium">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

const HourlyActivityChart = memo(function HourlyActivityChart({ 
  data 
}: { 
  data: DashboardChartsProps['hourlyActivity'] 
}) {
  return (
    <Card className="relative overflow-hidden shadow-lg col-span-2">
      <CardHeader>
        <CardTitle>24-Hour Activity Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis type="number" hide />
              <YAxis 
                dataKey="hour" 
                type="category" 
                tickFormatter={(hour) => `${hour}:00`}
                fontSize={12}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--muted)",
                  borderRadius: "6px",
                  padding: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value, name) => [
                  value,
                  name === "wagers" ? "Wagers" : "Active Users"
                ]}
                labelFormatter={(hour) => `${hour}:00`}
              />
              <Bar 
                dataKey="wagers" 
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
                name="wagers"
              >
                {data.map((entry, index) => {
                  const maxWagers = Math.max(...(data.map(h => h.wagers) || [1]));
                  return (
                    <Cell 
                      key={`cell-${index}`}
                      fill="hsl(var(--primary))"
                      opacity={0.2 + (entry.wagers / (maxWagers || 1)) * 0.8}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

// Main component that combines all charts
function DashboardCharts({ recentActivity, wagersByGame, hourlyActivity, colors }: DashboardChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Activity Overview Chart */}
      <ActivityChart data={recentActivity} />

      {/* Wagers by Game Chart */}
      <WagersByGameChart data={wagersByGame} colors={colors} />

      {/* 24-Hour Activity Heatmap */}
      <HourlyActivityChart data={hourlyActivity} />
    </div>
  );
}

export default memo(DashboardCharts);