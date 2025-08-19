import React from 'react';
import { useAppState } from '../context/AppContext';

export default function ModuleGuard({ module, children }) {
  const { enabledModules } = useAppState();
  if (!enabledModules.includes(module)) return null;
  return <>{children}</>;
}
