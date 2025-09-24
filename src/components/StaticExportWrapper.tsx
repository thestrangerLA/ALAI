
"use client";

import { Suspense } from 'react';

type StaticExportWrapperProps = {
  children: React.ReactNode;
  fallback: React.ReactNode;
};

export default function StaticExportWrapper({ children, fallback }: StaticExportWrapperProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
