import React from 'react';

const WireframeBox = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={`border-2 border-slate-300 bg-slate-100 rounded-lg p-4 ${className}`}>
    {children}
  </div>
);

const WireframeLine = ({ className }: { className?: string }) => (
  <div className={`h-3 bg-slate-300 rounded-full ${className}`} />
);

export const Wireframes = () => {
  return (
    <div className="p-8 space-y-12 bg-white">
      <h1 className="text-4xl font-bold">App Wireframes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Today Screen */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">1. Today (Dashboard)</h2>
          <WireframeBox className="h-96 space-y-4">
            <WireframeLine className="w-1/2" />
            <WireframeLine className="w-3/4" />
            <div className="grid grid-cols-2 gap-2">
              <WireframeBox className="h-20" />
              <WireframeBox className="h-20" />
            </div>
            <WireframeBox className="h-32" />
          </WireframeBox>
        </div>

        {/* Tasks Screen */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">2. Tasks</h2>
          <WireframeBox className="h-96 space-y-4">
            <div className="flex justify-between">
              <WireframeLine className="w-1/4" />
              <WireframeLine className="w-1/4" />
            </div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-2 items-center">
                <div className="w-5 h-5 border-2 border-slate-400 rounded-full" />
                <WireframeLine className="flex-1" />
              </div>
            ))}
          </WireframeBox>
        </div>

        {/* Connect Screen */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">3. Connect</h2>
          <WireframeBox className="h-96 space-y-4">
            <WireframeLine className="w-1/3" />
            <WireframeBox className="h-24" />
            <WireframeBox className="h-24" />
          </WireframeBox>
        </div>

        {/* Me Screen */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">4. Me (Profile)</h2>
          <WireframeBox className="h-96 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-300" />
              <div className="space-y-2 flex-1">
                <WireframeLine className="w-1/2" />
                <WireframeLine className="w-1/3" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <WireframeBox className="h-16" />
              <WireframeBox className="h-16" />
            </div>
            <WireframeBox className="h-20" />
          </WireframeBox>
        </div>
      </div>
    </div>
  );
};
