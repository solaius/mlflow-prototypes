import type { Config, Data } from '@puckeditor/core';

const DS = '@databricks/design-system';

const TYPE_MAP: Record<
  string,
  { importName: string | null; from: string | null; renderAs?: string; cssHint?: string }
> = {
  DuBoisButton: { importName: 'Button', from: DS },
  DuBoisInput: { importName: 'Input', from: DS },
  DuBoisSimpleSelect: { importName: 'SimpleSelect', from: DS },
  DuBoisSwitch: { importName: 'Switch', from: DS },
  DuBoisCheckbox: { importName: 'Checkbox', from: DS },
  DuBoisRadioGroup: { importName: 'Radio.Group', from: DS },
  DuBoisSegmentedControl: { importName: 'SegmentedControlGroup', from: DS },
  DuBoisSlider: { importName: 'Slider', from: DS },
  DuBoisToggleButton: { importName: 'ToggleButton', from: DS },
  DuBoisDropdownMenu: { importName: 'DropdownMenu', from: DS },
  DuBoisCard: { importName: 'Card', from: DS },
  DuBoisTabs: { importName: 'Tabs', from: DS },
  DuBoisTable: { importName: 'Table', from: DS },
  DuBoisFormField: { importName: 'FormUI', from: DS },
  DuBoisAccordion: { importName: 'Accordion', from: DS },
  DuBoisDrawer: { importName: 'Drawer', from: DS },
  DuBoisPreviewCard: { importName: 'PreviewCard', from: DS },
  DuBoisPopover: { importName: 'Popover', from: DS },
  DuBoisAlert: { importName: 'Alert', from: DS },
  DuBoisBanner: { importName: 'Banner', from: DS },
  DuBoisTooltip: { importName: 'Tooltip', from: DS },
  DuBoisModal: { importName: 'Modal', from: DS },
  DuBoisTypography: { importName: 'Typography', from: DS },
  DuBoisTag: { importName: 'Tag', from: DS },
  DuBoisAvatar: { importName: 'Avatar', from: DS },
  DuBoisEmpty: { importName: 'Empty', from: DS },
  DuBoisSpinner: { importName: 'Spinner', from: DS },
  DuBoisTableSkeleton: { importName: 'TableSkeleton', from: DS },
  DuBoisParagraphSkeleton: { importName: 'ParagraphSkeleton', from: DS },
  DuBoisTitleSkeleton: { importName: 'TitleSkeleton', from: DS },
  DuBoisGenericSkeleton: { importName: 'GenericSkeleton', from: DS },
  DuBoisProgress: { importName: 'Progress', from: DS },
  DuBoisStepper: { importName: 'Stepper', from: DS },
  DuBoisHoverCard: { importName: 'HoverCard', from: DS },
  DuBoisHeader: { importName: 'Header', from: DS },
  DuBoisBreadcrumb: { importName: 'Breadcrumb', from: DS },
  DuBoisPagination: { importName: 'CursorPagination', from: DS },
  DuBoisSpacer: { importName: 'Spacer', from: DS },
  DuBoisTextArea: { importName: 'Input.TextArea', from: DS },
  DuBoisDialogCombobox: { importName: 'DialogCombobox', from: DS },
  DuBoisNotification: { importName: 'Notification', from: DS },
  Columns: {
    importName: null,
    from: null,
    renderAs: 'div',
    cssHint: 'display: grid; gridTemplateColumns: repeat(N, 1fr)',
  },
  Rows: { importName: null, from: null, renderAs: 'div', cssHint: 'display: flex; flexDirection: column' },
  FlexRow: { importName: null, from: null, renderAs: 'div', cssHint: 'display: flex; flexDirection: row' },
  FlexColumn: { importName: null, from: null, renderAs: 'div', cssHint: 'display: flex; flexDirection: column' },
  Section: { importName: null, from: null, renderAs: 'div', cssHint: 'padding container' },
  Divider: { importName: null, from: null, renderAs: 'hr' },
  KeyValueGrid: { importName: null, from: null, renderAs: 'div', cssHint: 'label-value grid' },
  ListDetailLayout: { importName: null, from: null, renderAs: 'div', cssHint: 'display: flex; list + detail split' },
  ListItem: { importName: null, from: null, renderAs: 'div', cssHint: 'clickable list row' },
  CodeBlock: { importName: null, from: null, renderAs: 'pre', cssHint: 'syntax-highlighted code block' },
  LinkText: { importName: 'Typography.Link', from: DS },
  IconLabel: { importName: null, from: null, renderAs: 'span', cssHint: 'inline icon + text' },
  OverflowMenu: { importName: 'DropdownMenu', from: DS },
};

const ICON_IMPORT_MAP: Record<string, string> = {
  home: 'HomeIcon',
  beaker: 'BeakerIcon',
  textbox: 'TextBoxIcon',
  cloud: 'CloudModelIcon',
  plus: 'PlusIcon',
  trash: 'TrashIcon',
  pencil: 'PencilIcon',
  search: 'SearchIcon',
  gear: 'GearIcon',
  play: 'PlayIcon',
  lightning: 'LightningIcon',
  copy: 'CopyIcon',
  danger: 'DangerIcon',
  overflow: 'OverflowIcon',
  user: 'UserIcon',
  arrow: 'ArrowRightIcon',
  chevronDown: 'ChevronDownIcon',
  close: 'CloseIcon',
  newWindow: 'NewWindowIcon',
  refresh: 'RefreshIcon',
  download: 'DownloadIcon',
  filter: 'FilterIcon',
  bookmark: 'BookmarkIcon',
  info: 'InfoSmallIcon',
  checkCircle: 'CheckCircleIcon',
  xCircle: 'XCircleIcon',
  check: 'CheckIcon',
  warning: 'WarningIcon',
  sparkle: 'SparkleIcon',
  clock: 'ClockIcon',
  table: 'TableIcon',
  models: 'ModelsIcon',
  dash: 'DashIcon',
  no: 'NoIcon',
  wrench: 'WrenchIcon',
  visible: 'VisibleIcon',
  visibleOff: 'VisibleOffIcon',
  code: 'CodeIcon',
  database: 'DatabaseIcon',
  file: 'FileIcon',
  chartLine: 'ChartLineIcon',
  chain: 'ChainIcon',
  notebook: 'NotebookIcon',
  workflows: 'WorkflowsIcon',
  token: 'TokenIcon',
};

const SPACING_MAP: Record<string, string> = {
  none: '0',
  xs: 'theme.spacing.xs',
  sm: 'theme.spacing.sm',
  md: 'theme.spacing.md',
  lg: 'theme.spacing.lg',
};

const ICON_PROPS = new Set(['icon', 'endIcon', 'image', 'prefix', 'suffix']);
const SPACING_PROPS = new Set(['gap', 'size', 'padding', 'contentPadding', 'spacerSize']);

const SLOT_STRATEGY: Record<string, Record<string, string>> = {
  DuBoisCard: { content: 'children' },
  DuBoisModal: { content: 'children' },
  DuBoisDrawer: { content: 'children' },
  DuBoisPreviewCard: { content: 'children' },
  DuBoisFormField: { input: 'children' },
  DuBoisPopover: { content: 'children' },
  DuBoisTooltip: { content: 'children' },
  DuBoisHoverCard: { content: 'children' },
  DuBoisHeader: { breadcrumbs: 'prop', titleAddOns: 'prop', buttons: 'prop' },
  DuBoisTabs: { tab1: 'indexed', tab2: 'indexed', tab3: 'indexed', tab4: 'indexed' },
  DuBoisAccordion: { panel1: 'indexed', panel2: 'indexed', panel3: 'indexed', panel4: 'indexed' },
  FlexRow: { content: 'children' },
  FlexColumn: { content: 'children' },
  Section: { content: 'children' },
  SectionHeader: { action: 'prop' },
  SettingsRow: { trailing: 'prop' },
  ListDetailLayout: { list: 'prop', detail: 'prop' },
  Columns: { col1: 'indexed', col2: 'indexed', col3: 'indexed', col4: 'indexed', col5: 'indexed', col6: 'indexed' },
  Rows: { row1: 'indexed', row2: 'indexed', row3: 'indexed', row4: 'indexed', row5: 'indexed', row6: 'indexed' },
};

const DEFAULT_SKIP_VALUES: Set<unknown> = new Set([false, '', 'none', undefined, null, 'middle', 'default']);

function isDefaultValue(key: string, value: unknown, componentType: string): boolean {
  if (
    key === 'label' ||
    key === 'title' ||
    key === 'text' ||
    key === 'message' ||
    key === 'description' ||
    key === 'placeholder' ||
    key === 'value' ||
    key === 'code' ||
    key === 'href' ||
    key === 'name' ||
    key === 'triggerLabel' ||
    key === 'triggerText'
  )
    return false;
  if (key === 'type' && value === 'primary') return false;
  if (key === 'type' && (value === '' || value === undefined)) return true;
  if (key === 'level') return false;
  if (key === 'variant') return false;
  if (
    key === 'count' ||
    key === 'rows' ||
    key === 'columns' ||
    key === 'steps' ||
    key === 'options' ||
    key === 'items' ||
    key === 'tabs' ||
    key === 'panels'
  )
    return false;
  if (key === 'color' && value !== 'default' && value !== '' && value !== undefined) return false;
  if (key === 'defaultValue') return false;
  if (key === 'withoutMargins' && value === true) return false;
  if (key === 'bold' && value === true) return false;
  if (key === 'closable' && value === true) return false;
  if (key === 'danger' && value === true) return false;
  if (key === 'disabled' && value === true) return false;
  if (key === 'loading' && value === true) return false;
  if (key === 'required' && value === true) return false;
  if (key === 'selected' && value === true) return false;
  if (key === 'scrollable' && value === true) return false;
  if (key === 'grid' && value === true) return false;
  return DEFAULT_SKIP_VALUES.has(value);
}

function resolveIcon(value: string): { name: string; from: string } | undefined {
  if (!value || value === 'none') return undefined;
  const name = ICON_IMPORT_MAP[value];
  return name ? { name, from: DS } : undefined;
}

function resolveSpacing(value: string): string | undefined {
  return SPACING_MAP[value] || undefined;
}

function transformItem(item: any, config: Config): any {
  const typeInfo = TYPE_MAP[item.type] || { importName: item.type, from: null };
  const componentConfig = config.components?.[item.type];
  const fields = (componentConfig as any)?.fields || {};
  const slotMap = SLOT_STRATEGY[item.type] || {};

  const cleanProps: Record<string, any> = {};
  let children: any = undefined;

  for (const [key, value] of Object.entries(item.props || {})) {
    if (key === 'id') continue;
    if (key === 'puck') continue;

    const fieldDef = fields[key] as any;
    if (fieldDef?.type === 'slot' && Array.isArray(value)) {
      const transformedItems = (value as any[]).map((child) => transformItem(child, config));
      if (transformedItems.length === 0) continue;
      const strategy = slotMap[key] || 'children';
      if (strategy === 'children') {
        children = transformedItems;
      } else {
        cleanProps[key] = { _slot: strategy, items: transformedItems };
      }
      continue;
    }

    if (ICON_PROPS.has(key) && typeof value === 'string') {
      const resolved = resolveIcon(value);
      if (resolved) cleanProps[key] = resolved;
      continue;
    }

    if (SPACING_PROPS.has(key) && typeof value === 'string') {
      const resolved = resolveSpacing(value);
      if (resolved) cleanProps[key] = resolved;
      continue;
    }

    if (isDefaultValue(key, value, item.type)) continue;

    cleanProps[key] = value;
  }

  const result: Record<string, any> = {
    type: typeInfo.importName || item.type,
  };

  if (typeInfo.from) {
    result['_import'] = typeInfo.from;
  }
  if (typeInfo.renderAs) {
    result['_renderAs'] = typeInfo.renderAs;
    if (typeInfo.cssHint) result['_cssHint'] = typeInfo.cssHint;
  }

  if (Object.keys(cleanProps).length > 0) {
    result['props'] = cleanProps;
  }
  if (children) {
    result['children'] = children;
  }

  return result;
}

export function transformForAgent(data: Data, config: Config): any {
  return {
    _meta: {
      tool: 'MLflow Page Composer',
      format: 'agent-optimized-v1',
      instructions: [
        'Generate a React TypeScript component from this layout.',
        'Import components from the path in _import (usually @databricks/design-system).',
        'Components with _renderAs are layout primitives — render as the specified HTML element with CSS using useDesignSystemTheme() tokens.',
        'Spacing values like "theme.spacing.md" should be used verbatim in css={{ }} props.',
        'Icon objects { name, from } should be imported and rendered as JSX: <ChartLineIcon />.',
        '"children" arrays become JSX children of the parent component.',
        'Slots with _slot="prop" become named React props: <Header buttons={<Button />} />.',
        'Slots with _slot="indexed" are numbered panels (tab1, tab2...) — render inside a .map() or sequential blocks.',
      ].join(' '),
    },
    root: data.root?.props || {},
    content: (data.content || []).map((item) => transformItem(item, config)),
  };
}
