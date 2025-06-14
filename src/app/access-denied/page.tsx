import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldX, Home, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Access Denied",
  description: "You do not have permission to access this resource.",
};

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <ShieldX className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Access Denied
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this resource. Please contact
            your administrator if you believe this is an error.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Error Code: 403 - Forbidden</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="javascript:history.back()">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Link>
            </Button>

            <Button className="flex-1" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <Link
              href="/signin"
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign in with a different account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
