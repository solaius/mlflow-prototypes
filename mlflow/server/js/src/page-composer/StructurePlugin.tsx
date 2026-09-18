import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createUsePuck, useGetPuck } from '@puckeditor/core';
import type { Config } from '@puckeditor/core';
import { useDesignSystemTheme } from '@databricks/design-system';
import { Tree } from 'react-arborist';
import type { NodeRendererProps, MoveHandler, CursorProps } from 'react-arborist';
import { TreeApi } from 'react-arborist';

const usePuckStore = createUsePuck();
const ROOT_ZONE = 'root:default-zone';
const INDENT = 18;
const ROW_HEIGHT = 30;

let clipboard: any = null;
let clipboardLabel = '';

let idCounter = 0;
function newId(type: string) {
  return `${type}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;
}

function deepCloneWithNewIds(item: any, config: Config): any {
  const newProps = { ...item.props, id: newId(item.type) };
  const componentConfig = config.components?.[item.type];
  const fields = componentConfig?.fields || {};
  for (const key of Object.keys(fields)) {
    if ((fields[key] as any)?.type === 'slot' && Array.isArray(newProps[key])) {
      newProps[key] = newProps[key].map((child: any) => deepCloneWithNewIds(child, config));
    }
  }
  return { type: item.type, props: newProps };
}

interface TreeItem {
  id: string;
  name: string;
  preview: string;
  nodeType: 'component' | 'slot';
  componentType?: string;
  zone: string;
  index: number;
  slotZone?: string;
  children?: TreeItem[];
}

function buildArboristData(content: any[], zone: string, config: Config): TreeItem[] {
  return content.map((item, index) => {
    const componentConfig = config.components?.[item.type];
    const fields = componentConfig?.fields || {};
    const allSlotNames = Object.keys(fields).filter((k) => (fields[k] as any)?.type === 'slot');
    const activeSlotCount =
      item.props.count ??
      (Array.isArray(item.props.tabs) ? item.props.tabs.length : null) ??
      (Array.isArray(item.props.panels) ? item.props.panels.length : null);
    const slotNames = activeSlotCount != null ? allSlotNames.slice(0, activeSlotCount) : allSlotNames;
    const label = componentConfig?.label || item.type;
    const preview =
      item.props.title ||
      item.props.text ||
      (item.type !== 'Columns' && item.type !== 'Rows' ? item.props.label : '') ||
      item.props.message ||
      (item.props.count ? `(${item.props.count})` : '') ||
      '';

    const slotChildren: TreeItem[] = slotNames.map((slotName) => {
      const slotZone = `${item.props.id}:${slotName}`;
      const slotContent = Array.isArray(item.props[slotName]) ? item.props[slotName] : [];
      return {
        id: `slot:${slotZone}`,
        name: slotName,
        preview: '',
        nodeType: 'slot' as const,
        zone: slotZone,
        index: -1,
        slotZone,
        children: buildArboristData(slotContent, slotZone, config),
      };
    });

    return {
      id: item.props.id,
      name: label,
      preview,
      nodeType: 'component' as const,
      componentType: item.type,
      zone,
      index,
      children: slotChildren.length > 0 ? slotChildren : undefined,
    };
  });
}

function findLocation(
  id: string,
  content: any[],
  zone: string,
  config: Config,
): { index: number; zone: string } | null {
  for (let i = 0; i < content.length; i++) {
    if (content[i].props.id === id) return { index: i, zone };
    const componentConfig = config.components?.[content[i].type];
    const fields = componentConfig?.fields || {};
    for (const key of Object.keys(fields)) {
      if ((fields[key] as any)?.type === 'slot' && Array.isArray(content[i].props[key])) {
        const found = findLocation(id, content[i].props[key], `${content[i].props.id}:${key}`, config);
        if (found) return found;
      }
    }
  }
  return null;
}

function findRawItem(id: string, content: any[], config: Config): any {
  for (const item of content) {
    if (item.props.id === id) return item;
    const componentConfig = config.components?.[item.type];
    const fields = componentConfig?.fields || {};
    for (const key of Object.keys(fields)) {
      if ((fields[key] as any)?.type === 'slot' && Array.isArray(item.props[key])) {
        const found = findRawItem(id, item.props[key], config);
        if (found) return found;
      }
    }
  }
  return null;
}

/* ── SVG icons (module-level constants, currentColor inherits parent) ── */

const iconChevronRight = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const iconChevronDown = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const iconComponent = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="2.5" y="2.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);
const iconSlot = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M4 2.5v9M4 2.5h2.5M4 11.5h2.5M10 2.5v9M10 2.5H7.5M10 11.5H7.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);
const iconCopy = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="4.5" y="4.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M10 2.5H3.5a1 1 0 00-1 1V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
const iconDuplicate = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="4.5" y="4.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M10 2.5H3.5a1 1 0 00-1 1V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M8 7v3M6.5 8.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
const iconDelete = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const iconPlus = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const iconPaste = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="3" y="3.5" width="8" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M5.5 2h3a.5.5 0 01.5.5V3H5v-.5a.5.5 0 01.5-.5z" stroke="currentColor" strokeWidth="1" />
    <path d="M5.5 7h3M5.5 9.5h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

/* ── Pattern insert templates (composable basic component trees) ── */

function createItem(type: string, overrides: Record<string, any>, config: Config): any {
  const defaults = (config.components?.[type] as any)?.defaultProps || {};
  return { type, props: { ...defaults, id: newId(type), ...overrides } };
}

interface PatternDef {
  name: string;
  category: string;
  create: (config: Config) => any[];
}

const PATTERNS: PatternDef[] = [
  {
    name: 'Section Header',
    category: 'Layout',
    create: (c) => [
      createItem(
        'FlexRow',
        {
          gap: 'md',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          content: [
            createItem(
              'FlexColumn',
              {
                gap: 'none',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                content: [
                  createItem(
                    'DuBoisTypography',
                    { text: 'Section Title', variant: 'title', level: 3, withoutMargins: true },
                    c,
                  ),
                  createItem(
                    'DuBoisTypography',
                    { text: 'Optional description for this section.', variant: 'text', color: 'secondary' },
                    c,
                  ),
                ],
              },
              c,
            ),
            createItem('DuBoisButton', { label: 'Action', type: 'tertiary', size: 'small' }, c),
          ],
        },
        c,
      ),
    ],
  },
  {
    name: 'KPI Stat Card',
    category: 'Dashboard',
    create: (c) => [
      createItem(
        'DuBoisCard',
        {
          width: '100%',
          disableHover: true,
          content: [
            createItem(
              'FlexRow',
              {
                gap: 'sm',
                alignItems: 'center',
                justifyContent: 'flex-start',
                content: [
                  createItem('IconLabel', { text: '', icon: 'chartLine' }, c),
                  createItem(
                    'FlexColumn',
                    {
                      gap: 'none',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      content: [
                        createItem(
                          'DuBoisTypography',
                          { text: '1,247', variant: 'title', level: 3, withoutMargins: true },
                          c,
                        ),
                        createItem(
                          'DuBoisTypography',
                          { text: 'Total Runs', variant: 'text', color: 'secondary', size: 'sm' },
                          c,
                        ),
                      ],
                    },
                    c,
                  ),
                ],
              },
              c,
            ),
          ],
        },
        c,
      ),
    ],
  },
  {
    name: 'Settings Row',
    category: 'Settings',
    create: (c) => [
      createItem(
        'FlexRow',
        {
          gap: 'md',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          content: [
            createItem(
              'FlexColumn',
              {
                gap: 'none',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                content: [
                  createItem(
                    'DuBoisTypography',
                    { text: 'Setting name', variant: 'title', level: 4, withoutMargins: true },
                    c,
                  ),
                  createItem(
                    'DuBoisTypography',
                    { text: 'Description of what this setting controls.', variant: 'text' },
                    c,
                  ),
                ],
              },
              c,
            ),
            createItem('DuBoisSwitch', { label: 'On', checked: false }, c),
          ],
        },
        c,
      ),
    ],
  },
  {
    name: 'Chart Card',
    category: 'Dashboard',
    create: (c) => [
      createItem(
        'Section',
        {
          padding: 'lg',
          background: 'default',
          maxWidth: '',
          content: [
            createItem(
              'FlexRow',
              {
                gap: 'sm',
                alignItems: 'center',
                justifyContent: 'flex-start',
                content: [createItem('IconLabel', { text: 'Request Volume', icon: 'chartLine' }, c)],
              },
              c,
            ),
            createItem('DuBoisTypography', { text: '12,345', variant: 'title', level: 3, withoutMargins: true }, c),
            createItem('DuBoisSpacer', { size: 'md', shrinks: false }, c),
            createItem(
              'DuBoisEmpty',
              {
                title: 'Chart Area',
                description: 'Replace this with your chart component.',
                image: 'chartLine',
                ctaLabel: '',
              },
              c,
            ),
          ],
        },
        c,
      ),
    ],
  },
  {
    name: 'Metadata Rows',
    category: 'Data Display',
    create: (c) => [
      createItem(
        'Rows',
        {
          count: 4,
          gap: 'none',
          row1: [
            createItem(
              'FlexRow',
              {
                gap: 'md',
                justifyContent: 'flex-start',
                alignItems: 'center',
                content: [
                  createItem(
                    'DuBoisTypography',
                    { text: 'Created by', variant: 'text', color: 'secondary', size: 'sm' },
                    c,
                  ),
                  createItem('DuBoisTypography', { text: 'user@example.com', variant: 'text' }, c),
                ],
              },
              c,
            ),
          ],
          row2: [
            createItem(
              'FlexRow',
              {
                gap: 'md',
                justifyContent: 'flex-start',
                alignItems: 'center',
                content: [
                  createItem(
                    'DuBoisTypography',
                    { text: 'Status', variant: 'text', color: 'secondary', size: 'sm' },
                    c,
                  ),
                  createItem('DuBoisTag', { label: 'Active', color: 'lime', closable: false, icon: 'none' }, c),
                ],
              },
              c,
            ),
          ],
          row3: [
            createItem(
              'FlexRow',
              {
                gap: 'md',
                justifyContent: 'flex-start',
                alignItems: 'center',
                content: [
                  createItem(
                    'DuBoisTypography',
                    { text: 'Last updated', variant: 'text', color: 'secondary', size: 'sm' },
                    c,
                  ),
                  createItem('DuBoisTypography', { text: '2 hours ago', variant: 'text' }, c),
                ],
              },
              c,
            ),
          ],
          row4: [
            createItem(
              'FlexRow',
              {
                gap: 'md',
                justifyContent: 'flex-start',
                alignItems: 'center',
                content: [
                  createItem(
                    'DuBoisTypography',
                    { text: 'Version', variant: 'text', color: 'secondary', size: 'sm' },
                    c,
                  ),
                  createItem('DuBoisTypography', { text: '3', variant: 'text' }, c),
                ],
              },
              c,
            ),
          ],
        },
        c,
      ),
    ],
  },
  {
    name: 'Filter + Table',
    category: 'Data Display',
    create: (c) => [
      createItem(
        'FlexColumn',
        {
          gap: 'sm',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          content: [
            createItem(
              'FlexRow',
              {
                gap: 'sm',
                justifyContent: 'flex-start',
                alignItems: 'center',
                content: [
                  createItem(
                    'DuBoisInput',
                    { placeholder: 'Search by name...', label: '', prefix: 'search', value: '' },
                    c,
                  ),
                  createItem('DuBoisButton', { label: 'Filters', icon: 'filter', type: '', size: 'middle' }, c),
                ],
              },
              c,
            ),
            createItem('DuBoisTable', {}, c),
          ],
        },
        c,
      ),
    ],
  },
];

/* ── Component picker (portal, keyboard nav, grouped) ── */

const ComponentPicker: React.FC<{
  config: Config;
  onPick: (componentType: string) => void;
  onPickPattern?: (items: any[]) => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}> = ({ config, onPick, onPickPattern, onClose, anchorRef }) => {
  const { theme } = useDesignSystemTheme();
  const [search, setSearch] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);
  const [highlighted, setHighlighted] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const categories = config.categories || {};
  const allComponents = Object.keys(config.components || {});
  const lowerSearch = search.toLowerCase();

  const filteredPatterns = useMemo(
    () => (lowerSearch ? PATTERNS.filter((p) => p.name.toLowerCase().includes(lowerSearch)) : PATTERNS),
    [lowerSearch],
  );

  const items = useMemo(() => {
    const comps: string[] = [];
    if (lowerSearch) {
      comps.push(
        ...allComponents.filter((key) => {
          const l = (config.components?.[key] as any)?.label || key;
          return l.toLowerCase().includes(lowerSearch) || key.toLowerCase().includes(lowerSearch);
        }),
      );
    } else {
      for (const cat of Object.values(categories)) {
        comps.push(...((cat as any).components || []));
      }
    }
    return comps;
  }, [lowerSearch, allComponents, categories, config.components]);

  const totalPickable = items.length + filteredPatterns.length;

  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const pw = 248;
    const ph = 340;
    let top = rect.bottom + 4;
    if (top + ph > window.innerHeight) top = Math.max(4, rect.top - ph - 4);
    let left = rect.left;
    if (left + pw > window.innerWidth) left = window.innerWidth - pw - 8;
    setPos({ top, left: Math.max(4, left) });
  }, [anchorRef]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    setHighlighted(0);
  }, [search]);

  useEffect(() => {
    scrollRef.current?.querySelector('[data-highlighted="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, totalPickable - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      if (highlighted < items.length && items[highlighted]) {
        onPick(items[highlighted]);
      } else {
        const patternIdx = highlighted - items.length;
        if (filteredPatterns[patternIdx] && onPickPattern) {
          onPickPattern(filteredPatterns[patternIdx].create(config));
        }
      }
    }
  };

  const itemCss = (isHighlighted: boolean) =>
    ({
      padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
      cursor: 'pointer',
      borderRadius: theme.borders.borderRadiusMd,
      fontSize: theme.typography.fontSizeSm,
      color: theme.colors.textPrimary,
      backgroundColor: isHighlighted ? theme.colors.actionDefaultBackgroundHover : 'transparent',
      '&:hover': { backgroundColor: theme.colors.actionDefaultBackgroundHover },
    }) as const;

  return createPortal(
    <div
      ref={pickerRef}
      css={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        width: 248,
        backgroundColor: theme.colors.backgroundPrimary,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borders.borderRadiusMd,
        boxShadow: theme.shadows.lg,
        maxHeight: 340,
        display: 'flex',
        flexDirection: 'column' as const,
      }}
    >
      <div css={{ padding: theme.spacing.xs, flexShrink: 0 }}>
        <input
          autoFocus
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          css={{
            width: '100%',
            padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borders.borderRadiusMd,
            fontSize: theme.typography.fontSizeSm,
            backgroundColor: theme.colors.backgroundPrimary,
            color: theme.colors.textPrimary,
            outline: 'none',
            boxSizing: 'border-box' as const,
            '&:focus': { borderColor: theme.colors.actionPrimaryBackgroundDefault },
          }}
        />
      </div>
      <div
        ref={scrollRef}
        css={{ overflow: 'auto', flex: 1, padding: `0 ${theme.spacing.xs}px ${theme.spacing.xs}px` }}
      >
        {totalPickable === 0 && (
          <div
            css={{
              padding: theme.spacing.md,
              color: theme.colors.textPlaceholder,
              textAlign: 'center' as const,
              fontSize: theme.typography.fontSizeSm,
            }}
          >
            No matches
          </div>
        )}
        {lowerSearch
          ? items.map((key, i) => (
              <div
                key={key}
                data-highlighted={i === highlighted}
                onClick={() => onPick(key)}
                css={itemCss(i === highlighted)}
              >
                {(config.components?.[key] as any)?.label || key}
              </div>
            ))
          : Object.entries(categories).map(([catKey, cat]) => {
              const comps = ((cat as any).components || []) as string[];
              if (comps.length === 0) return null;
              return (
                <div key={catKey}>
                  <div
                    css={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: theme.colors.textPlaceholder,
                      padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                      textTransform: 'uppercase' as const,
                      letterSpacing: 0.5,
                      marginTop: theme.spacing.xs,
                    }}
                  >
                    {(cat as any).title}
                  </div>
                  {comps.map((key) => {
                    const flatIdx = items.indexOf(key);
                    return (
                      <div
                        key={key}
                        data-highlighted={flatIdx === highlighted}
                        onClick={() => onPick(key)}
                        css={{ ...itemCss(flatIdx === highlighted), paddingLeft: theme.spacing.md }}
                      >
                        {(config.components?.[key] as any)?.label || key}
                      </div>
                    );
                  })}
                </div>
              );
            })}
        {filteredPatterns.length > 0 && onPickPattern && (
          <div>
            <div
              css={{
                fontSize: 11,
                fontWeight: 600,
                color: theme.colors.actionPrimaryBackgroundDefault,
                padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                textTransform: 'uppercase' as const,
                letterSpacing: 0.5,
                marginTop: theme.spacing.sm,
                borderTop: `1px solid ${theme.colors.borderDecorative}`,
                paddingTop: theme.spacing.sm,
              }}
            >
              Patterns
            </div>
            {filteredPatterns.map((pattern, pi) => {
              const globalIdx = items.length + pi;
              return (
                <div
                  key={pattern.name}
                  data-highlighted={globalIdx === highlighted}
                  onClick={() => onPickPattern(pattern.create(config))}
                  css={{ ...itemCss(globalIdx === highlighted), paddingLeft: theme.spacing.md }}
                >
                  {pattern.name}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

/* ── Drop cursor — horizontal accent line between rows ── */

const DropCursor: React.FC<CursorProps> = ({ top, left }) => {
  const { theme } = useDesignSystemTheme();
  return (
    <div
      css={{
        position: 'absolute',
        top: top - 1,
        left,
        right: INDENT,
        height: 2,
        backgroundColor: theme.colors.actionPrimaryBackgroundDefault,
        borderRadius: 1,
        pointerEvents: 'none',
        zIndex: 1,
        '&::before': {
          content: '""',
          position: 'absolute',
          left: -3,
          top: -3,
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: theme.colors.actionPrimaryBackgroundDefault,
        },
      }}
    />
  );
};

/* ── Small icon-only action button ── */

const ActionBtn: React.FC<{
  title: string;
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
}> = ({ title, icon, onClick, danger }) => {
  const { theme } = useDesignSystemTheme();
  return (
    <button
      title={title}
      onClick={onClick}
      css={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '2px 3px',
        borderRadius: theme.borders.borderRadiusMd,
        color: danger ? theme.colors.textValidationDanger : theme.colors.textSecondary,
        display: 'inline-flex',
        alignItems: 'center',
        lineHeight: 0,
        '&:hover': {
          backgroundColor: theme.colors.actionDefaultBackgroundHover,
          color: danger ? theme.colors.textValidationDanger : theme.colors.textPrimary,
        },
      }}
    >
      {icon}
    </button>
  );
};

/* ── Indent guide lines — vertical lines at each ancestor level ── */

const GuideLines: React.FC<{ level: number; color: string }> = React.memo(({ level, color }) => (
  <>
    {Array.from({ length: level }, (_, i) => (
      <div
        key={i}
        css={{
          position: 'absolute',
          left: i * INDENT + INDENT / 2,
          top: 0,
          bottom: 0,
          width: 1,
          backgroundColor: color,
          pointerEvents: 'none',
          opacity: 0.6,
        }}
      />
    ))}
  </>
));

/* ── Tree row renderer ── */

const NodeRenderer = ({ node, style, dragHandle }: NodeRendererProps<TreeItem>) => {
  const { theme } = useDesignSystemTheme();
  const dispatch = usePuckStore((s) => s.dispatch);
  const config = usePuckStore((s) => s.config);
  const getState = useGetPuck();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, forceUpdate] = useState(0);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const data = node.data;

  /* ── Slot node ── */
  if (data.nodeType === 'slot') {
    const handlePaste = () => {
      if (!clipboard || !data.slotZone) return;
      const cloned = deepCloneWithNewIds(clipboard, config as Config);
      dispatch({
        type: 'setData',
        data: (prev: any) => {
          const insertInto = (content: any[], currentZone: string): any[] => {
            if (currentZone === data.slotZone) return [...content, cloned];
            return content.map((comp: any) => {
              const cfg = (config.components as any)?.[comp.type];
              const fields = cfg?.fields || {};
              const newProps = { ...comp.props };
              for (const key of Object.keys(fields)) {
                if (fields[key]?.type === 'slot' && Array.isArray(newProps[key])) {
                  newProps[key] = insertInto(newProps[key], `${comp.props.id}:${key}`);
                }
              }
              return { ...comp, props: newProps };
            });
          };
          return { ...prev, content: insertInto(prev.content, ROOT_ZONE) };
        },
      });
      forceUpdate((n) => n + 1);
    };

    const isEmpty = !node.children || node.children.length === 0;

    return (
      <div style={style} css={{ display: 'flex', alignItems: 'center', height: ROW_HEIGHT }}>
        <GuideLines level={node.level} color={theme.colors.borderDecorative} />
        <div
          css={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            width: '100%',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {!isEmpty ? (
            <span
              onClick={() => node.toggle()}
              css={{ cursor: 'pointer', display: 'inline-flex', color: theme.colors.textPlaceholder, flexShrink: 0 }}
            >
              {node.isOpen ? iconChevronDown : iconChevronRight}
            </span>
          ) : (
            <span css={{ width: 14, flexShrink: 0 }} />
          )}
          <span
            css={{
              fontStyle: 'italic',
              color: theme.colors.textPlaceholder,
              fontSize: theme.typography.fontSizeSm,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onClick={() => node.toggle()}
          >
            {data.name}
          </span>
          <button
            ref={addBtnRef}
            onClick={(e) => {
              e.stopPropagation();
              setPickerOpen(!pickerOpen);
            }}
            css={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '1px 4px',
              borderRadius: theme.borders.borderRadiusMd,
              color: theme.colors.actionPrimaryBackgroundDefault,
              display: 'inline-flex',
              alignItems: 'center',
              lineHeight: 0,
              flexShrink: 0,
              '&:hover': { backgroundColor: theme.colors.actionDefaultBackgroundHover },
            }}
          >
            {iconPlus}
          </button>
          {clipboard && (
            <ActionBtn
              title={`Paste "${clipboardLabel}"`}
              icon={iconPaste}
              onClick={(e) => {
                e.stopPropagation();
                handlePaste();
              }}
            />
          )}
        </div>
        {pickerOpen && (
          <ComponentPicker
            config={config as Config}
            anchorRef={addBtnRef as any}
            onPick={(type) => {
              const childCount = node.children?.length || 0;
              dispatch({
                type: 'insert',
                componentType: type,
                destinationIndex: childCount,
                destinationZone: data.slotZone!,
              });
              setPickerOpen(false);
            }}
            onPickPattern={(patternItems) => {
              const zone = data.slotZone!;
              dispatch({
                type: 'setData',
                data: (prev: any) => {
                  const addToZone = (content: any[], currentZone: string): any[] => {
                    if (currentZone === zone) return [...content, ...patternItems];
                    return content.map((comp: any) => {
                      const cfg = (config.components as any)?.[comp.type];
                      const fields = cfg?.fields || {};
                      const newProps = { ...comp.props };
                      for (const key of Object.keys(fields)) {
                        if (fields[key]?.type === 'slot' && Array.isArray(newProps[key])) {
                          newProps[key] = addToZone(newProps[key], `${comp.props.id}:${key}`);
                        }
                      }
                      return { ...comp, props: newProps };
                    });
                  };
                  if (zone === ROOT_ZONE) return { ...prev, content: [...prev.content, ...patternItems] };
                  return { ...prev, content: addToZone(prev.content, ROOT_ZONE) };
                },
              });
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
    );
  }

  /* ── Component node ── */
  const handleClick = () => {
    const state = getState();
    const loc = findLocation(data.id, state.appState.data.content, ROOT_ZONE, state.config as Config);
    if (loc) dispatch({ type: 'setUi', ui: { itemSelector: { index: loc.index, zone: loc.zone } } });
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const state = getState();
    const item = findRawItem(data.id, state.appState.data.content, state.config as Config);
    if (item) {
      clipboard = JSON.parse(JSON.stringify(item));
      clipboardLabel = data.name;
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'duplicate', sourceIndex: data.index, sourceZone: data.zone });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'remove', index: data.index, zone: data.zone });
  };

  const isSelected = node.isSelected;

  return (
    <div
      ref={dragHandle}
      style={style}
      onClick={handleClick}
      css={{
        display: 'flex',
        alignItems: 'center',
        height: ROW_HEIGHT,
        cursor: 'grab',
        backgroundColor: isSelected ? theme.colors.actionDefaultBackgroundHover : 'transparent',
        '&:hover': !isSelected ? { backgroundColor: theme.colors.actionDefaultBackgroundHover } : undefined,
        '&:hover .structure-actions': { opacity: 1 },
      }}
    >
      {/* Selection accent bar */}
      {isSelected && (
        <div
          css={{
            position: 'absolute',
            left: 0,
            top: 3,
            bottom: 3,
            width: 2,
            borderRadius: 1,
            backgroundColor: theme.colors.actionPrimaryBackgroundDefault,
            zIndex: 2,
          }}
        />
      )}

      <GuideLines level={node.level} color={theme.colors.borderDecorative} />

      <div
        css={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.xs,
          width: '100%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Expand / collapse chevron */}
        {!node.isLeaf ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              node.toggle();
            }}
            css={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              color: theme.colors.textSecondary,
              flexShrink: 0,
              borderRadius: theme.borders.borderRadiusMd,
              '&:hover': { color: theme.colors.textPrimary },
            }}
          >
            {node.isOpen ? iconChevronDown : iconChevronRight}
          </span>
        ) : (
          <span css={{ width: 14, flexShrink: 0 }} />
        )}

        {/* Name */}
        <span
          css={{
            fontSize: theme.typography.fontSizeSm,
            fontWeight: isSelected ? 600 : 'normal',
            color: theme.colors.textPrimary,
            flexShrink: 0,
            whiteSpace: 'nowrap' as const,
          }}
        >
          {data.name}
        </span>

        {/* Preview text */}
        {data.preview && (
          <span
            css={{
              color: theme.colors.textPlaceholder,
              fontSize: theme.typography.fontSizeSm,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' as const,
              flex: 1,
              minWidth: 0,
            }}
          >
            {data.preview}
          </span>
        )}

        {/* Hover actions */}
        <span
          className="structure-actions"
          css={{
            opacity: 0,
            display: 'inline-flex',
            gap: 1,
            marginLeft: 'auto',
            flexShrink: 0,
            transition: 'opacity 100ms',
          }}
        >
          <ActionBtn title="Copy" icon={iconCopy} onClick={handleCopy} />
          <ActionBtn title="Duplicate" icon={iconDuplicate} onClick={handleDuplicate} />
          <ActionBtn title="Delete" icon={iconDelete} onClick={handleDelete} danger />
        </span>
      </div>
    </div>
  );
};

/* ── Structure panel — wraps the tree with an "Add to page" button ── */

const StructurePanel: React.FC = () => {
  const { theme } = useDesignSystemTheme();
  const config = usePuckStore((s) => s.config);
  const data = usePuckStore((s) => s.appState.data);
  const dispatch = usePuckStore((s) => s.dispatch);
  const selectedItem = usePuckStore((s) => s.selectedItem);
  const selectedId = selectedItem?.props?.id;

  const [rootPickerOpen, setRootPickerOpen] = useState(false);
  const rootAddBtnRef = useRef<HTMLButtonElement>(null);

  const treeData = useMemo(() => buildArboristData(data.content, ROOT_ZONE, config as Config), [data, config]);

  const handleMove: MoveHandler<TreeItem> = useCallback(
    ({ dragIds, parentId, index }) => {
      const dragId = dragIds[0];
      if (!dragId || dragId.startsWith('slot:')) return;

      const source = findLocation(dragId, data.content, ROOT_ZONE, config as Config);
      if (!source) return;

      let destZone: string;
      let destIndex: number;

      if (parentId && parentId.startsWith('slot:')) {
        destZone = parentId.replace('slot:', '');
        destIndex = index;
      } else if (parentId) {
        const parentLoc = findLocation(parentId, data.content, ROOT_ZONE, config as Config);
        if (!parentLoc) return;
        destZone = parentLoc.zone;
        destIndex = index;
      } else {
        destZone = ROOT_ZONE;
        destIndex = index;
      }

      if (source.zone === destZone) {
        dispatch({
          type: 'reorder',
          sourceIndex: source.index,
          destinationIndex: destIndex,
          destinationZone: destZone,
        });
      } else {
        dispatch({
          type: 'move',
          sourceIndex: source.index,
          sourceZone: source.zone,
          destinationIndex: destIndex,
          destinationZone: destZone,
        });
      }
    },
    [data, config, dispatch],
  );

  const treeRef = useRef<TreeApi<TreeItem>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [treeHeight, setTreeHeight] = useState(600);

  useEffect(() => {
    if (selectedId) treeRef.current?.scrollTo(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height - 50;
      if (h > 0) setTreeHeight(h);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} css={{ height: '100%', display: 'flex', flexDirection: 'column' as const }}>
      <div css={{ padding: theme.spacing.sm, flexShrink: 0 }}>
        <button
          ref={rootAddBtnRef}
          onClick={() => setRootPickerOpen(!rootPickerOpen)}
          css={{
            width: '100%',
            padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
            border: `1px dashed ${theme.colors.borderDecorative}`,
            borderRadius: theme.borders.borderRadiusMd,
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSizeSm,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.xs,
            transition: 'border-color 150ms, color 150ms',
            '&:hover': {
              borderColor: theme.colors.actionPrimaryBackgroundDefault,
              color: theme.colors.actionPrimaryBackgroundDefault,
            },
          }}
        >
          {iconPlus}
          Add to page
        </button>
        {rootPickerOpen && (
          <ComponentPicker
            config={config as Config}
            anchorRef={rootAddBtnRef as any}
            onPick={(type) => {
              dispatch({
                type: 'insert',
                componentType: type,
                destinationIndex: data.content.length,
                destinationZone: ROOT_ZONE,
              });
              setRootPickerOpen(false);
            }}
            onPickPattern={(patternItems) => {
              dispatch({
                type: 'setData',
                data: (prev: any) => ({ ...prev, content: [...prev.content, ...patternItems] }),
              });
              setRootPickerOpen(false);
            }}
            onClose={() => setRootPickerOpen(false)}
          />
        )}
      </div>
      <div css={{ flex: 1, overflow: 'auto' }}>
        {data.content.length === 0 ? (
          <div
            css={{
              color: theme.colors.textPlaceholder,
              padding: theme.spacing.lg,
              textAlign: 'center' as const,
              fontSize: theme.typography.fontSizeSm,
              lineHeight: 1.6,
            }}
          >
            Empty page
            <br />
            Click + above to add components
          </div>
        ) : (
          <Tree<TreeItem>
            ref={treeRef}
            data={treeData}
            width="100%"
            height={treeHeight}
            indent={INDENT}
            rowHeight={ROW_HEIGHT}
            openByDefault
            onMove={handleMove}
            selection={selectedId}
            disableDrag={(d) => d?.nodeType === 'slot' || String(d?.id).startsWith('slot:')}
            disableDrop={(args) => {
              if (!args.parentNode?.data) return false;
              return args.parentNode.data.nodeType === 'component';
            }}
            idAccessor="id"
            childrenAccessor="children"
            renderCursor={DropCursor}
          >
            {NodeRenderer}
          </Tree>
        )}
      </div>
    </div>
  );
};

export const structurePlugin = {
  name: 'structure',
  label: 'Structure',
  icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="14" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1" y="6.5" width="6" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="6.5" width="6" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1" y="12" width="14" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  render: () => <StructurePanel />,
};
