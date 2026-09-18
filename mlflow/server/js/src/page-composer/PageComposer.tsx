import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Puck, Render } from '@puckeditor/core';
import type { Data } from '@puckeditor/core';
import { toPng } from 'html-to-image';
import '@puckeditor/core/puck.css';
import { puckConfig } from './puck-components';
import { structurePlugin } from './StructurePlugin';
import { transformForAgent } from './agent-export';
import LZString from 'lz-string';
import { templates } from './templates';
import type { PageTemplate } from './templates';
import {
  Button,
  DropdownMenu,
  Input,
  Modal,
  Radio,
  SegmentedControlButton,
  SegmentedControlGroup,
  SimpleSelect,
  SimpleSelectOption,
  Tooltip,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { SunIcon, MoonIcon } from '@databricks/design-system';

const STORAGE_KEY = 'mlflow-page-composer-data';
const JOURNEYS_KEY = 'mlflow-page-composer-journeys';
const OLD_SNAPSHOTS_KEY = 'mlflow-page-composer-snapshots';
const DEFAULT_JOURNEY = 'Default';

interface Snapshot {
  name: string;
  data: Data;
  timestamp: number;
}

interface JourneysData {
  journeys: Record<string, Snapshot[]>;
  activeJourney: string;
}

const loadSavedData = (): Data | undefined => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : undefined;
  } catch {
    return undefined;
  }
};

const loadJourneys = (): JourneysData => {
  try {
    const saved = localStorage.getItem(JOURNEYS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fall through to migration
  }
  // Migrate from old flat snapshots format
  try {
    const oldSnapshots = localStorage.getItem(OLD_SNAPSHOTS_KEY);
    if (oldSnapshots) {
      const parsed = JSON.parse(oldSnapshots);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const migrated: JourneysData = {
          journeys: { [DEFAULT_JOURNEY]: parsed },
          activeJourney: DEFAULT_JOURNEY,
        };
        localStorage.setItem(JOURNEYS_KEY, JSON.stringify(migrated));
        localStorage.removeItem(OLD_SNAPSHOTS_KEY);
        return migrated;
      }
    }
  } catch {
    // ignore migration errors
  }
  return { journeys: { [DEFAULT_JOURNEY]: [] }, activeJourney: DEFAULT_JOURNEY };
};

const saveJourneys = (data: JourneysData) => {
  localStorage.setItem(JOURNEYS_KEY, JSON.stringify(data));
};

const isValidPuckData = (data: unknown): data is Data => {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return Array.isArray(d['content']) && d['root'] != null && typeof d['root'] === 'object';
};

const hasContent = (data: Data | undefined): boolean =>
  Boolean(data && Array.isArray(data.content) && data.content.length > 0);

const TextInputModal: React.FC<{
  componentId: string;
  visible: boolean;
  title: string;
  okText: string;
  description?: string;
  placeholder?: string;
  initialValue?: string;
  danger?: boolean;
  onOk: (value: string) => void;
  onCancel: () => void;
}> = ({ componentId, visible, title, okText, description, placeholder, initialValue = '', danger, onOk, onCancel }) => {
  const { theme } = useDesignSystemTheme();
  const [value, setValue] = useState(initialValue);
  React.useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);
  return (
    <Modal
      componentId={componentId}
      visible={visible}
      title={title}
      okText={okText}
      onOk={() => onOk(value)}
      onCancel={onCancel}
      okButtonProps={danger ? { danger: true } : undefined}
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        {description && <Typography.Text>{description}</Typography.Text>}
        {placeholder !== undefined && (
          <Input
            componentId={`${componentId}-input`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
          />
        )}
      </div>
    </Modal>
  );
};

const ImportModal: React.FC<{
  visible: boolean;
  resetKey: number;
  activeJourney: string;
  existingJourneys: string[];
  onImport: (
    result: { type: 'page'; data: Data } | { type: 'journey'; snapshots: Snapshot[]; journeyName?: string },
  ) => void;
  onCancel: () => void;
}> = ({ visible, resetKey, activeJourney, existingJourneys, onImport, onCancel }) => {
  const { theme } = useDesignSystemTheme();
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importTarget, setImportTarget] = useState<'current' | 'new'>('current');
  const [importJourneyName, setImportJourneyName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (visible) {
      setImportText('');
      setImportError('');
      setImportTarget('current');
      setImportJourneyName('');
    }
  }, [visible, resetKey]);

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (Array.isArray(parsed)) {
        const imported: Snapshot[] = parsed
          .filter((item: any) => item.name && item.data && isValidPuckData(item.data))
          .map((item: any, i: number) => ({
            name: item.name,
            data: item.data,
            timestamp: item.timestamp || Date.now() + i,
          }));
        if (imported.length === 0) {
          setImportError('No valid pages found in the journey array.');
          return;
        }
        if (importTarget === 'new') {
          const name = importJourneyName.trim();
          if (!name) {
            setImportError('Please enter a journey name.');
            return;
          }
          if (existingJourneys.includes(name)) {
            setImportError(`Journey "${name}" already exists.`);
            return;
          }
          onImport({ type: 'journey', snapshots: imported, journeyName: name });
        } else {
          onImport({ type: 'journey', snapshots: imported });
        }
        return;
      }
      if (!isValidPuckData(parsed)) {
        setImportError('Invalid format. Must be a page layout or a journey (array of {name, data}).');
        return;
      }
      onImport({ type: 'page', data: parsed });
    } catch {
      setImportError('Invalid JSON. Please check the syntax.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImportText(reader.result as string);
      setImportError('');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <Modal
      componentId="page-composer.import-modal"
      visible={visible}
      title="Import Layout JSON"
      okText="Import"
      onOk={handleImport}
      onCancel={onCancel}
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        <Typography.Text>Paste or upload JSON — a single page layout or a journey (array of pages).</Typography.Text>
        <textarea
          value={importText}
          onChange={(e) => {
            setImportText(e.target.value);
            setImportError('');
          }}
          placeholder='{"content": [...], "root": {"props": {}}}'
          css={{
            width: '100%',
            minHeight: 200,
            fontFamily: 'monospace',
            fontSize: theme.typography.fontSizeSm,
            padding: theme.spacing.sm,
            borderRadius: theme.borders.borderRadiusMd,
            border: `1px solid ${importError ? theme.colors.actionDangerDefaultBorderDefault : theme.colors.borderDecorative}`,
            resize: 'vertical' as const,
          }}
        />
        <Radio.Group
          componentId="page-composer.import-target"
          name="import-target"
          defaultValue="current"
          layout="vertical"
          onChange={(e: any) => setImportTarget(e.target.value)}
        >
          <Radio value="current">Add to current journey ({activeJourney})</Radio>
          <Radio value="new">Create new journey</Radio>
        </Radio.Group>
        {importTarget === 'new' && (
          <Input
            componentId="page-composer.import-journey-name"
            value={importJourneyName}
            onChange={(e) => setImportJourneyName(e.target.value)}
            placeholder="Journey name"
          />
        )}
        {importError && <Typography.Text color="error">{importError}</Typography.Text>}
        <div>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} css={{ display: 'none' }} />
          <Button componentId="page-composer.upload-file" size="small" onClick={() => fileInputRef.current?.click()}>
            Upload .json file
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const composerPlugins = [structurePlugin];
const iframeConfig = { enabled: false } as const;
const defaultData: Data = { content: [], root: { props: {} } };

const MemoizedPuck = React.memo(
  ({
    editorKey,
    data,
    overrides,
    onChange,
  }: {
    editorKey: number;
    data: Data;
    overrides: any;
    onChange: (data: Data) => void;
  }) => (
    <Puck
      key={editorKey}
      config={puckConfig}
      data={data}
      onChange={onChange}
      plugins={composerPlugins}
      iframe={iframeConfig}
      overrides={overrides}
    />
  ),
);

const SaveSnapshotModal: React.FC<{
  visible: boolean;
  activeJourney: string;
  existingSnapshots: Snapshot[];
  onSaveNew: (name: string) => void;
  onReplace: (index: number) => void;
  onCancel: () => void;
}> = ({ visible, activeJourney, existingSnapshots, onSaveNew, onReplace, onCancel }) => {
  const { theme } = useDesignSystemTheme();
  const hasExisting = existingSnapshots.length > 0;
  const [mode, setMode] = useState<'new' | 'replace'>('replace');
  const [name, setName] = useState('');
  const [replaceIndex, setReplaceIndex] = useState(0);
  const isDuplicate = existingSnapshots.some((s) => s.name === name.trim());

  React.useEffect(() => {
    if (visible) {
      setName('');
      setMode(hasExisting ? 'replace' : 'new');
      setReplaceIndex(existingSnapshots.length > 0 ? existingSnapshots.length - 1 : 0);
    }
  }, [visible, hasExisting, existingSnapshots.length]);

  const handleOk = () => {
    if (mode === 'new') {
      if (!name.trim() || isDuplicate) return;
      onSaveNew(name);
    } else {
      onReplace(replaceIndex);
    }
  };

  return (
    <Modal
      componentId="page-composer.snapshot-modal"
      visible={visible}
      title={`Save Snapshot — ${activeJourney}`}
      okText={mode === 'new' ? 'Save' : 'Replace'}
      onOk={handleOk}
      onCancel={onCancel}
      okButtonProps={mode === 'replace' ? { danger: true } : undefined}
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        {hasExisting && (
          <Radio.Group
            componentId="page-composer.snapshot-save-mode"
            name="snapshot-save-mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as 'new' | 'replace')}
          >
            <Radio value="replace">Replace existing snapshot</Radio>
            <Radio value="new">Save as new snapshot</Radio>
          </Radio.Group>
        )}
        {mode === 'replace' && hasExisting && (
          <SimpleSelect
            componentId="page-composer.snapshot-replace-select"
            id="snapshot-replace-select"
            value={String(replaceIndex)}
            onChange={(val) => setReplaceIndex(Number(val))}
          >
            {existingSnapshots.map((s, i) => (
              <SimpleSelectOption key={i} value={String(i)}>
                {s.name}
              </SimpleSelectOption>
            ))}
          </SimpleSelect>
        )}
        {mode === 'new' && (
          <>
            <Input
              componentId="page-composer.snapshot-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Step 1: List View"
            />
            {isDuplicate && <Typography.Text color="error">A snapshot with this name already exists.</Typography.Text>}
          </>
        )}
      </div>
    </Modal>
  );
};

interface PageComposerProps {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const PageComposer: React.FC<PageComposerProps> = ({ isDarkMode = false, onToggleDarkMode }) => {
  const { theme } = useDesignSystemTheme();
  const [previewMode, setPreviewMode] = useState(false);
  const [journeyMode, setJourneyMode] = useState(false);
  const [journeyIndex, setJourneyIndex] = useState(0);
  const [savedData, setSavedData] = useState<Data | undefined>(loadSavedData);
  const [currentData, setCurrentData] = useState<Data | undefined>(savedData);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importCounter, setImportCounter] = useState(0);
  const [editorKey, setEditorKey] = useState(0);
  const [pendingTemplate, setPendingTemplate] = useState<PageTemplate | null>(null);
  const [journeysData, setJourneysData] = useState<JourneysData>(loadJourneys);
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [snapshotsListOpen, setSnapshotsListOpen] = useState(false);
  const [newJourneyModalOpen, setNewJourneyModalOpen] = useState(false);
  const [renameJourneyModalOpen, setRenameJourneyModalOpen] = useState(false);
  const [deleteJourneyConfirmOpen, setDeleteJourneyConfirmOpen] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);

  const activeJourney = journeysData.activeJourney;
  const snapshots = useMemo(() => journeysData.journeys[activeJourney] || [], [journeysData, activeJourney]);
  const journeyNames = useMemo(() => Object.keys(journeysData.journeys), [journeysData]);
  const activeData = currentData || savedData;

  const updateJourneys = useCallback((updater: (prev: JourneysData) => JourneysData) => {
    setJourneysData((prev) => {
      const next = updater(prev);
      saveJourneys(next);
      return next;
    });
  }, []);

  const handleSwitchJourney = useCallback(
    (name: string) => {
      if (name === activeJourney) return;
      const hasUnsaved = hasContent(currentData) && JSON.stringify(currentData) !== JSON.stringify(savedData);
      if (hasUnsaved && !window.confirm('You have unsaved changes. Switch journey anyway?')) return;

      updateJourneys((prev) => ({ ...prev, activeJourney: name }));
      const targetSnapshots = journeysData.journeys[name] || [];
      if (targetSnapshots.length > 0) {
        const first = targetSnapshots[0];
        setSavedData(first.data);
        setCurrentData(first.data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(first.data));
        setEditorKey((k) => k + 1);
      } else {
        setSavedData(undefined);
        setCurrentData(undefined);
        localStorage.removeItem(STORAGE_KEY);
        setEditorKey((k) => k + 1);
      }
    },
    [updateJourneys, activeJourney, currentData, savedData, journeysData.journeys],
  );

  const handleCreateJourney = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || journeysData.journeys[trimmed]) return;
      updateJourneys((prev) => ({
        journeys: { ...prev.journeys, [trimmed]: [] },
        activeJourney: trimmed,
      }));
      setNewJourneyModalOpen(false);
    },
    [journeysData.journeys, updateJourneys],
  );

  const handleRenameJourney = useCallback(
    (newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === activeJourney || journeysData.journeys[trimmed]) return;
      updateJourneys((prev) => {
        const { [activeJourney]: snaps, ...rest } = prev.journeys;
        return { journeys: { ...rest, [trimmed]: snaps }, activeJourney: trimmed };
      });
      setRenameJourneyModalOpen(false);
    },
    [activeJourney, journeysData.journeys, updateJourneys],
  );

  const handleDeleteJourney = useCallback(() => {
    if (journeyNames.length <= 1) return;
    updateJourneys((prev) => {
      const { [activeJourney]: _, ...rest } = prev.journeys;
      const nextActive = Object.keys(rest)[0];
      return { journeys: rest, activeJourney: nextActive };
    });
    setDeleteJourneyConfirmOpen(false);
  }, [activeJourney, journeyNames.length, updateJourneys]);

  const handleExportJSON = useCallback(() => {
    if (!activeData) return;
    const blob = new Blob([JSON.stringify(activeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'page-design.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [activeData]);

  const handleCopyJSON = useCallback(() => {
    if (!activeData) return;
    navigator.clipboard.writeText(JSON.stringify(activeData, null, 2));
  }, [activeData]);

  const handleCopyAgentJSON = useCallback(() => {
    if (!activeData) return;
    const agentData = transformForAgent(activeData, puckConfig);
    navigator.clipboard.writeText(JSON.stringify(agentData, null, 2));
  }, [activeData]);

  const handleExportAgentJSON = useCallback(() => {
    if (!activeData) return;
    const agentData = transformForAgent(activeData, puckConfig);
    const blob = new Blob([JSON.stringify(agentData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'page-design-agent.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [activeData]);

  const [shareCopied, setShareCopied] = useState(false);
  const handleShare = useCallback(() => {
    if (!activeData) return;
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(activeData));
    const shareUrl = `${window.location.origin}${window.location.pathname}#share:${compressed}`;
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }, [activeData]);

  const handleShareJourney = useCallback(() => {
    if (snapshots.length === 0) return;
    const payload = { journey: activeJourney, snapshots: snapshots.map((s) => ({ name: s.name, data: s.data })) };
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
    const shareUrl = `${window.location.origin}${window.location.pathname}#journey:${compressed}`;
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }, [snapshots, activeJourney]);

  const previewRef = useRef<HTMLDivElement>(null);
  const handleExportPNG = useCallback(async () => {
    const el = previewRef.current;
    if (!el) return;
    const prevOverflow = el.style.overflow;
    el.style.overflow = 'visible';
    const bg = window.getComputedStyle(document.body).backgroundColor;
    try {
      const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: bg });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'page-design.png';
      a.click();
    } finally {
      el.style.overflow = prevOverflow;
    }
  }, []);

  const handleImportResult = useCallback(
    (result: { type: 'page'; data: Data } | { type: 'journey'; snapshots: Snapshot[]; journeyName?: string }) => {
      if (result.type === 'page') {
        setSavedData(result.data);
        setCurrentData(result.data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
        setEditorKey((k) => k + 1);
      } else if (result.journeyName) {
        updateJourneys((prev) => ({
          journeys: { ...prev.journeys, [result.journeyName!]: result.snapshots },
          activeJourney: result.journeyName!,
        }));
      } else {
        updateJourneys((prev) => ({
          ...prev,
          journeys: {
            ...prev.journeys,
            [prev.activeJourney]: [...(prev.journeys[prev.activeJourney] || []), ...result.snapshots],
          },
        }));
      }
      setImportModalOpen(false);
    },
    [updateJourneys],
  );

  const loadTemplate = useCallback((template: PageTemplate) => {
    setSavedData(template.data);
    setCurrentData(template.data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(template.data));
    setEditorKey((k) => k + 1);
  }, []);

  const handleTemplateSelect = useCallback(
    (template: PageTemplate) => {
      if (hasContent(activeData)) {
        setPendingTemplate(template);
      } else {
        loadTemplate(template);
      }
    },
    [activeData, loadTemplate],
  );

  const handleConfirmTemplate = useCallback(() => {
    if (pendingTemplate) {
      loadTemplate(pendingTemplate);
      setPendingTemplate(null);
    }
  }, [pendingTemplate, loadTemplate]);

  const handleSaveNewSnapshot = useCallback(
    (name: string) => {
      if (!activeData || !name.trim()) return;
      if (snapshots.some((s) => s.name === name.trim())) return;
      const snapshot: Snapshot = { name: name.trim(), data: activeData, timestamp: Date.now() };
      updateJourneys((prev) => ({
        ...prev,
        journeys: {
          ...prev.journeys,
          [prev.activeJourney]: [...(prev.journeys[prev.activeJourney] || []), snapshot],
        },
      }));
      setSavedData(activeData);
      setSnapshotModalOpen(false);
    },
    [activeData, snapshots, updateJourneys],
  );

  const handleReplaceSnapshot = useCallback(
    (index: number) => {
      if (!activeData || index < 0 || index >= snapshots.length) return;
      updateJourneys((prev) => {
        const current = prev.journeys[prev.activeJourney] || [];
        const updated = current.map((s, i) => (i === index ? { ...s, data: activeData, timestamp: Date.now() } : s));
        return { ...prev, journeys: { ...prev.journeys, [prev.activeJourney]: updated } };
      });
      setSavedData(activeData);
      setSnapshotModalOpen(false);
    },
    [activeData, snapshots.length, updateJourneys],
  );

  const handleDeleteSnapshot = useCallback(
    (index: number) => {
      updateJourneys((prev) => ({
        ...prev,
        journeys: {
          ...prev.journeys,
          [prev.activeJourney]: (prev.journeys[prev.activeJourney] || []).filter((_, i) => i !== index),
        },
      }));
    },
    [updateJourneys],
  );

  const handleLoadSnapshot = useCallback((snapshot: Snapshot) => {
    setSavedData(snapshot.data);
    setCurrentData(snapshot.data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.data));
    setEditorKey((k) => k + 1);
    setSnapshotsListOpen(false);
  }, []);

  const handleExportJourney = useCallback(() => {
    if (snapshots.length === 0) return;
    const journey = snapshots.map((s) => ({ name: s.name, data: s.data }));
    const blob = new Blob([JSON.stringify(journey, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeJourney.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [snapshots, activeJourney]);

  const hasActiveContent = hasContent(activeData);
  const snapshotCount = snapshots.length;

  const puckOverrides = useMemo(
    () => ({
      headerActions: () => (
        <>
          {/* Journey dropdown — switch, manage, snapshots, play */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button componentId="page-composer.journey-selector" size="small">
                Journey: {activeJourney}
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="start">
              {journeyNames.map((name) => (
                <DropdownMenu.Item
                  key={name}
                  componentId={`page-composer.journey-select-${name}`}
                  onClick={() => handleSwitchJourney(name)}
                >
                  <span
                    css={name === activeJourney ? { fontWeight: theme.typography.typographyBoldFontWeight } : undefined}
                  >
                    {name}
                    {name === activeJourney && (
                      <span
                        css={{ color: theme.colors.textSecondary, fontWeight: 'normal', marginLeft: theme.spacing.xs }}
                      >
                        ({(journeysData.journeys[name] || []).length} snapshots)
                      </span>
                    )}
                  </span>
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                componentId="page-composer.save-snapshot"
                disabled={!hasActiveContent}
                onClick={() => setSnapshotModalOpen(true)}
              >
                Save Snapshot
              </DropdownMenu.Item>
              <DropdownMenu.Item
                componentId="page-composer.snapshots-list"
                disabled={snapshotCount === 0}
                onClick={() => setSnapshotsListOpen(true)}
              >
                View Snapshots{snapshotCount > 0 ? ` (${snapshotCount})` : ''}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                componentId="page-composer.journey"
                disabled={snapshotCount === 0}
                onClick={() => {
                  setJourneyIndex(0);
                  setJourneyMode(true);
                }}
              >
                Play Journey
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          {/* Templates dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button componentId="page-composer.templates" size="small">
                Templates
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              {templates.map((t) => (
                <DropdownMenu.Item
                  key={t.name}
                  componentId={`page-composer.template-${t.name}`}
                  onClick={() => handleTemplateSelect(t)}
                >
                  <div>
                    <Typography.Text bold>{t.name}</Typography.Text>
                    <br />
                    <Typography.Text color="secondary" css={{ fontSize: theme.typography.fontSizeSm }}>
                      {t.description}
                    </Typography.Text>
                  </div>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <Button
            componentId="page-composer.preview"
            size="small"
            disabled={!hasActiveContent}
            onClick={() => setPreviewMode(true)}
          >
            Preview
          </Button>
          <Button
            componentId="page-composer.import"
            size="small"
            onClick={() => {
              setImportCounter((c) => c + 1);
              setImportModalOpen(true);
            }}
          >
            Import
          </Button>
          {onToggleDarkMode && (
            <Tooltip
              componentId="page-composer.dark-mode-tooltip"
              content={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <Button
                componentId="page-composer.dark-mode-toggle"
                size="small"
                icon={isDarkMode ? <SunIcon /> : <MoonIcon />}
                onClick={onToggleDarkMode}
              />
            </Tooltip>
          )}
        </>
      ),
    }),
    [
      activeJourney,
      journeyNames,
      journeysData,
      snapshotCount,
      hasActiveContent,
      activeData,
      theme,
      isDarkMode,
      onToggleDarkMode,
      handleSwitchJourney,
      handleTemplateSelect,
      handleExportJSON,
      handleCopyJSON,
    ],
  );

  // Journey mode — walk through snapshots one by one
  if (journeyMode && snapshots.length > 0) {
    const current = snapshots[journeyIndex];
    return (
      <div css={{ padding: theme.spacing.md, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div css={{ marginBottom: theme.spacing.md, display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
          <Button componentId="page-composer.journey-exit" onClick={() => setJourneyMode(false)}>
            Exit Journey
          </Button>
          <Button
            componentId="page-composer.journey-prev"
            disabled={journeyIndex === 0}
            onClick={() => setJourneyIndex((i) => i - 1)}
          >
            Previous
          </Button>
          <Button
            componentId="page-composer.journey-next"
            disabled={journeyIndex === snapshots.length - 1}
            onClick={() => setJourneyIndex((i) => i + 1)}
          >
            Next
          </Button>
          <Typography.Text bold>
            {journeyIndex + 1} / {snapshots.length}
          </Typography.Text>
          <Typography.Text color="secondary"> — </Typography.Text>
          <Typography.Title level={4} withoutMargins>
            {activeJourney}: {current?.name}
          </Typography.Title>
          <div css={{ marginLeft: 'auto', display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
            <Button componentId="page-composer.journey-export" size="small" onClick={handleExportJourney}>
              Export Journey
            </Button>
            <Button componentId="page-composer.journey-share" size="small" onClick={handleShareJourney}>
              {shareCopied ? 'Copied!' : 'Share Link'}
            </Button>
            <SegmentedControlGroup
              componentId="page-composer.journey-viewport"
              name="journey-viewport-width"
              value={String(previewWidth || 0)}
              onChange={(e: any) => {
                const val = e.target.value;
                setPreviewWidth(val === '0' ? null : Number(val));
              }}
            >
              <SegmentedControlButton value="0">
                Full
              </SegmentedControlButton>
              <SegmentedControlButton value="1440">
                1440
              </SegmentedControlButton>
              <SegmentedControlButton value="1280">
                1280
              </SegmentedControlButton>
              <SegmentedControlButton value="768">
                768
              </SegmentedControlButton>
            </SegmentedControlGroup>
            {onToggleDarkMode && (
              <Tooltip
                componentId="page-composer.journey-dark-tooltip"
                content={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <Button
                  componentId="page-composer.journey-dark-toggle"
                  size="small"
                  icon={isDarkMode ? <SunIcon /> : <MoonIcon />}
                  onClick={onToggleDarkMode}
                />
              </Tooltip>
            )}
          </div>
        </div>
        <div
          css={{
            flex: 1,
            border: `1px solid ${theme.colors.borderDecorative}`,
            borderRadius: theme.borders.borderRadiusMd,
            background: theme.colors.backgroundPrimary,
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            css={{
              width: previewWidth || '100%',
              maxWidth: '100%',
              padding: theme.spacing.lg,
              transition: 'width 200ms ease',
            }}
          >
            {current && <Render config={puckConfig} data={current.data} />}
          </div>
        </div>
      </div>
    );
  }

  // Preview mode — single page preview
  if (previewMode && activeData) {
    return (
      <div css={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div
          css={{
            padding: theme.spacing.sm,
            display: 'flex',
            gap: theme.spacing.sm,
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Button componentId="page-composer.back" onClick={() => setPreviewMode(false)}>
            Back to Editor
          </Button>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button componentId="page-composer.preview-export-menu" type="primary">
                Export
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="start">
              <DropdownMenu.Item componentId="page-composer.preview-export-png" onClick={handleExportPNG}>
                Export PNG
              </DropdownMenu.Item>
              <DropdownMenu.Item componentId="page-composer.preview-export-json" onClick={handleExportJSON}>
                Export JSON
              </DropdownMenu.Item>
              <DropdownMenu.Item componentId="page-composer.preview-export-agent" onClick={handleExportAgentJSON}>
                Export AI Agent JSON
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item componentId="page-composer.preview-copy-json" onClick={handleCopyJSON}>
                Copy JSON
              </DropdownMenu.Item>
              <DropdownMenu.Item componentId="page-composer.preview-copy-agent" onClick={handleCopyAgentJSON}>
                Copy for AI Agent
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item componentId="page-composer.preview-share" onClick={handleShare}>
                {shareCopied ? 'Link Copied!' : 'Share Link'}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
          <Typography.Text color="secondary" css={{ flex: 1 }}>
            Preview Mode
          </Typography.Text>
          <SegmentedControlGroup
            componentId="page-composer.viewport-selector"
            name="viewport-width"
            value={String(previewWidth || 0)}
            onChange={(e: any) => {
              const val = e.target.value;
              setPreviewWidth(val === '0' ? null : Number(val));
            }}
          >
            <SegmentedControlButton value="0">
              Full
            </SegmentedControlButton>
            <SegmentedControlButton value="1440">
              1440
            </SegmentedControlButton>
            <SegmentedControlButton value="1280">
              1280
            </SegmentedControlButton>
            <SegmentedControlButton value="768">
              768
            </SegmentedControlButton>
          </SegmentedControlGroup>
          {onToggleDarkMode && (
            <Tooltip
              componentId="page-composer.preview-dark-tooltip"
              content={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <Button
                componentId="page-composer.preview-dark-toggle"
                icon={isDarkMode ? <SunIcon /> : <MoonIcon />}
                onClick={onToggleDarkMode}
              />
            </Tooltip>
          )}
        </div>
        <div
          ref={previewRef}
          css={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            css={{
              width: previewWidth || '100%',
              maxWidth: '100%',
              transition: 'width 200ms ease',
              ...(previewWidth && {
                borderLeft: `1px dashed ${theme.colors.borderDecorative}`,
                borderRight: `1px dashed ${theme.colors.borderDecorative}`,
              }),
            }}
          >
            <Render config={puckConfig} data={activeData} />
          </div>
        </div>
      </div>
    );
  }

  // Editor mode
  return (
    <div css={{ height: '100vh' }}>
      <MemoizedPuck
        editorKey={editorKey}
        data={activeData || defaultData}
        overrides={puckOverrides}
        onChange={setCurrentData}
      />

      <TextInputModal
        componentId="page-composer.new-journey-modal"
        visible={newJourneyModalOpen}
        title="New Journey"
        okText="Create"
        description="Create a new journey folder to organize snapshots for a different feature."
        placeholder="e.g., Model Registry Redesign"
        onOk={handleCreateJourney}
        onCancel={() => setNewJourneyModalOpen(false)}
      />
      <TextInputModal
        componentId="page-composer.rename-journey-modal"
        visible={renameJourneyModalOpen}
        title="Rename Journey"
        okText="Rename"
        initialValue={activeJourney}
        placeholder=""
        onOk={handleRenameJourney}
        onCancel={() => setRenameJourneyModalOpen(false)}
      />
      <Modal
        componentId="page-composer.delete-journey-modal"
        visible={deleteJourneyConfirmOpen}
        title="Delete Journey?"
        okText="Delete"
        onOk={handleDeleteJourney}
        onCancel={() => setDeleteJourneyConfirmOpen(false)}
        okButtonProps={{ danger: true }}
      >
        <Typography.Text>
          Delete <strong>{activeJourney}</strong> and all its {snapshots.length} snapshot
          {snapshots.length !== 1 ? 's' : ''}? This cannot be undone.
        </Typography.Text>
      </Modal>
      <SaveSnapshotModal
        visible={snapshotModalOpen}
        activeJourney={activeJourney}
        existingSnapshots={snapshots}
        onSaveNew={handleSaveNewSnapshot}
        onReplace={handleReplaceSnapshot}
        onCancel={() => setSnapshotModalOpen(false)}
      />

      {/* Snapshots list modal */}
      <Modal
        componentId="page-composer.snapshots-list-modal"
        visible={snapshotsListOpen}
        title={`Snapshots — ${activeJourney} (${snapshots.length})`}
        onCancel={() => setSnapshotsListOpen(false)}
        footer={null}
        size="wide"
      >
        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {snapshots.length === 0 && (
            <Typography.Text color="secondary">No snapshots yet. Save one from the editor.</Typography.Text>
          )}
          {snapshots.map((snap, i) => (
            <div
              key={i}
              css={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
                borderRadius: theme.borders.borderRadiusMd,
                border: `1px solid ${theme.colors.borderDecorative}`,
              }}
            >
              <Typography.Text bold css={{ flex: 1 }}>
                {i + 1}. {snap.name}
              </Typography.Text>
              <Typography.Text color="secondary" css={{ fontSize: theme.typography.fontSizeSm }}>
                {new Date(snap.timestamp).toLocaleString()}
              </Typography.Text>
              <Button
                componentId={`page-composer.snapshot-load-${i}`}
                size="small"
                onClick={() => handleLoadSnapshot(snap)}
              >
                Load
              </Button>
              <Button
                componentId={`page-composer.snapshot-delete-${i}`}
                size="small"
                danger
                onClick={() => handleDeleteSnapshot(i)}
              >
                Delete
              </Button>
            </div>
          ))}
          <div css={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
            {snapshots.length > 1 && (
              <>
                <Button
                  componentId="page-composer.play-journey-from-list"
                  type="primary"
                  onClick={() => {
                    setSnapshotsListOpen(false);
                    setJourneyIndex(0);
                    setJourneyMode(true);
                  }}
                >
                  Play Journey
                </Button>
                <Button componentId="page-composer.export-journey" onClick={handleExportJourney}>
                  Export Journey
                </Button>
              </>
            )}
            <div css={{ marginLeft: 'auto', display: 'flex', gap: theme.spacing.sm }}>
              <Button
                componentId="page-composer.journey-new-from-list"
                size="small"
                onClick={() => {
                  setSnapshotsListOpen(false);
                  setNewJourneyModalOpen(true);
                }}
              >
                New Journey
              </Button>
              <Button
                componentId="page-composer.journey-rename-from-list"
                size="small"
                onClick={() => {
                  setSnapshotsListOpen(false);
                  setRenameJourneyModalOpen(true);
                }}
              >
                Rename
              </Button>
              {journeyNames.length > 1 && (
                <Button
                  componentId="page-composer.journey-delete-from-list"
                  size="small"
                  danger
                  onClick={() => {
                    setSnapshotsListOpen(false);
                    setDeleteJourneyConfirmOpen(true);
                  }}
                >
                  Delete Journey
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ImportModal
        visible={importModalOpen}
        resetKey={importCounter}
        activeJourney={activeJourney}
        existingJourneys={journeyNames}
        onImport={handleImportResult}
        onCancel={() => setImportModalOpen(false)}
      />

      {/* Confirm template replacement modal */}
      <Modal
        componentId="page-composer.confirm-template"
        visible={pendingTemplate !== null}
        title="Replace current layout?"
        okText="Replace"
        cancelText="Cancel"
        onOk={handleConfirmTemplate}
        onCancel={() => setPendingTemplate(null)}
        okButtonProps={{ danger: true }}
      >
        <Typography.Text>
          Loading the <strong>{pendingTemplate?.name}</strong> template will replace your current layout. This cannot be
          undone.
        </Typography.Text>
      </Modal>
    </div>
  );
};

export default PageComposer;
