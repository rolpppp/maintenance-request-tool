'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/Button';

export function CopyRefButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return; // Clipboard blocked: the number is on screen to copy by hand.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="ghost" onClick={copy} className="h-11">
      {!copied && <Copy size={16} aria-hidden="true" />}
      <span role="status">{copied ? 'Copied ✓' : 'Copy'}</span>
    </Button>
  );
}
