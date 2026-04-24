"use client";

import dynamic from 'next/dynamic';

// Dynamically import the actual component to disable SSR
// This prevents 'jsdom' and 'canvas' Node.js module errors from fabric.js
const ZoneConfigurationInner = dynamic(
  () => import('./ZoneConfigurationInner'),
  { ssr: false }
);

export default function ZoneConfiguration() {
  return <ZoneConfigurationInner />;
}
