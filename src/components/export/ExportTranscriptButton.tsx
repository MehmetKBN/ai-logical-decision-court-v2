import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { DELIBERATION_ORDER } from '../../config/hats';
import { PROVIDERS } from '../../config/providers';
import { useCourtStore } from '../../store/useCourtStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import {
  downloadMarkdownFile,
  formatCourtTranscriptMarkdown,
} from '../../utils/markdownExport';

export interface ExportTranscriptButtonProps {
  variant?: 'default' | 'compact';
}

export function ExportTranscriptButton({
  variant = 'default',
}: ExportTranscriptButtonProps) {
  const casePrompt = useCourtStore((s) => s.casePrompt);
  const contextConstraints = useCourtStore((s) => s.contextConstraints);
  const status = useCourtStore((s) => s.status);
  const activeHatId = useCourtStore((s) => s.activeHatId);
  const responses = useCourtStore((s) => s.responses);

  const provider = useSettingsStore((s) => s.provider);
  const demoMode = useSettingsStore((s) => s.demoMode);
  const effectiveModelId = useSettingsStore((s) => s.getEffectiveModelId());

  const [copied, setCopied] = useState(false);

  const hasAnyCompletedHat = DELIBERATION_ORDER.some(
    (id) =>
      responses[id].status === 'completed' ||
      responses[id].content.trim().length > 0,
  );

  if (!hasAnyCompletedHat) {
    return null;
  }

  const isSessionComplete = status === 'completed';

  const getModelLabel = (): string => {
    if (demoMode) {
      return 'Built-in Demo Simulator (Mock Engine)';
    }
    return `${PROVIDERS[provider].name} (${effectiveModelId})`;
  };

  const buildMarkdown = (): string => {
    return formatCourtTranscriptMarkdown(
      {
        casePrompt,
        contextConstraints,
        status,
        activeHatId,
        responses,
      },
      getModelLabel(),
    );
  };

  const handleCopy = async () => {
    try {
      const md = buildMarkdown();
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard permission is denied
    }
  };

  const handleDownload = () => {
    const md = buildMarkdown();
    downloadMarkdownFile(md, 'decision-court-verdict.md');
  };

  const buttonPadding =
    variant === 'compact' ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs';

  return (
    <div
      className="inline-flex items-center gap-2"
      role="group"
      aria-label="Export Court Transcript"
    >
      <button
        type="button"
        onClick={() => void handleCopy()}
        title="Copy full court transcript and verdict as Markdown"
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border font-medium transition-all ${buttonPadding} ${
          copied
            ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200'
            : isSessionComplete
              ? 'border-blue-500/40 bg-blue-500/15 text-blue-200 hover:bg-blue-500/25 hover:text-white'
              : 'border-slate-700/80 bg-slate-900/90 text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white'
        }`}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span>Copy Markdown</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleDownload}
        title="Download full transcript as decision-court-verdict.md"
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border font-medium transition-all ${buttonPadding} ${
          isSessionComplete
            ? 'border-blue-500/50 bg-blue-600/25 text-blue-100 shadow-sm shadow-blue-500/10 hover:bg-blue-600/35 hover:text-white'
            : 'border-slate-700/80 bg-slate-900/90 text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Download className="h-3.5 w-3.5" />
        <span>Download .md</span>
      </button>
    </div>
  );
}
