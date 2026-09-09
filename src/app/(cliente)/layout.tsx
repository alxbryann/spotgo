import Header from "@/components/Header";
export default function ClientLayout({ children }: { children: React.ReactNode }) { return <><Header /><main className="flex flex-1 flex-col">{children}</main></>; }
