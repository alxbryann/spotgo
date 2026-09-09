"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
type Revenue = { day: string; revenue: number; reservations: number };
type Occupancy = { hour: number; occupancy: number };
export default function Charts({ revenue, occupancy }: { revenue: Revenue[]; occupancy: Occupancy[] }) { return <div className="grid gap-6 lg:grid-cols-2"><div className="h-72 rounded-3xl bg-white p-5"><h2 className="font-black">Ingresos diarios</h2><ResponsiveContainer><BarChart data={revenue}><XAxis dataKey="day"/><YAxis/><Tooltip/><Bar dataKey="revenue" fill="#84cc16" radius={6}/></BarChart></ResponsiveContainer></div><div className="h-72 rounded-3xl bg-white p-5"><h2 className="font-black">Ocupación por hora</h2><ResponsiveContainer><LineChart data={occupancy}><XAxis dataKey="hour"/><YAxis/><Tooltip/><Line type="monotone" dataKey="occupancy" stroke="#0f172a" strokeWidth={3}/></LineChart></ResponsiveContainer></div></div> }
