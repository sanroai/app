'use client';

import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
        </div>
        
        <div className="relative flex flex-col justify-center px-16 text-white">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold">Sanro AI</span>
          </Link>
          
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Where Every Student
            <br />
            Sees Learning
            <br />
            Come Alive!
          </h1>
          
          <p className="text-lg text-white/80 mb-8 max-w-md">
            AI-powered personalised education with gamification, AR models, and smart analytics designed for Indian classrooms.
          </p>
          
          <div className="flex gap-8">
            <div>
              <div className="text-3xl font-bold">5000+</div>
              <div className="text-sm text-white/70">Video Lessons</div>
            </div>
            <div>
              <div className="text-3xl font-bold">100%</div>
              <div className="text-sm text-white/70">Board Mapped</div>
            </div>
            <div>
              <div className="text-3xl font-bold">5★</div>
              <div className="text-sm text-white/70">Rating</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-brand-50 via-white to-purple-50 px-4 py-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}