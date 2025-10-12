import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="container mx-auto p-4 max-w-md">
      <h1 className="text-3xl font-bold text-center mb-8">AI Trader Journal</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your Trading Journal, Sebastian</CardTitle>
          <CardDescription>
            Track your options trades with intelligent real-time analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full">Start New Analysis</Button>
          <Button variant="outline" className="w-full">View Journal</Button>
        </CardContent>
      </Card>
    </main>
  );
}