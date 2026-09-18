import type { Config } from '@puckeditor/core';
import React from 'react';
import {
  ArrowRightIcon,
  BeakerIcon,
  BookmarkIcon,
  ChainIcon,
  ChartLineIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  CloseIcon,
  CloudModelIcon,
  CodeIcon,
  CopyIcon,
  DangerIcon,
  DashIcon,
  DatabaseIcon,
  DownloadIcon,
  FileIcon,
  FilterIcon,
  GearIcon,
  HomeIcon,
  InfoSmallIcon,
  LightningIcon,
  ModelsIcon,
  NewWindowIcon,
  NoIcon,
  NotebookIcon,
  OverflowIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  SidebarCollapseIcon,
  SparkleIcon,
  TableIcon,
  TextBoxIcon,
  TokenIcon,
  TrashIcon,
  UserIcon,
  VisibleIcon,
  VisibleOffIcon,
  WarningIcon,
  WorkflowsIcon,
  WrenchIcon,
  XCircleIcon,
  Accordion,
  Alert,
  Avatar,
  Banner,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  CursorPagination,
  DangerModal,
  DialogCombobox,
  DialogComboboxContent,
  DialogComboboxOptionList,
  DialogComboboxOptionListCheckboxItem,
  DialogComboboxOptionListSelectItem,
  DialogComboboxTrigger,
  Drawer,
  DropdownMenu,
  Empty,
  FormUI,
  GenericSkeleton,
  Header,
  HoverCard,
  Input,
  Notification,
  ParagraphSkeleton,
  Popover,
  PreviewCard,
  Progress,
  Radio,
  SegmentedControlButton,
  SegmentedControlGroup,
  SimpleSelect,
  SimpleSelectOption,
  Slider,
  Spacer,
  Spinner,
  Stepper,
  Switch,
  Table,
  TableCell,
  TableFilterInput,
  TableFilterLayout,
  TableHeader,
  TableRow,
  TableSkeleton,
  TitleSkeleton,
  Tabs,
  Tag,
  ToggleButton,
  Tooltip,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { MlflowLogo } from '../common/components/MlflowLogo';

// ---------------------------------------------------------------------------
// Type definitions for all Puck-registered components
// ---------------------------------------------------------------------------
type PuckComponents = {
  // Layout
  Columns: { count: number; gap: string; col1?: any; col2?: any; col3?: any; col4?: any; col5?: any; col6?: any };
  Rows: { count: number; gap: string; row1?: any; row2?: any; row3?: any; row4?: any; row5?: any; row6?: any };
  FlexRow: { content?: any; gap: string; justifyContent: string; alignItems: string };
  FlexColumn: { content?: any; gap: string; alignItems: string; justifyContent: string };
  Section: { content?: any; padding: string; background: string; maxWidth: string };
  DuBoisSpacer: { size: string; shrinks: boolean };
  Divider: {};
  // Navigation
  DuBoisHeader: { title: string; breadcrumbs?: any; titleAddOns?: any; buttons?: any };
  DuBoisBreadcrumb: { items: { label: string }[]; includeTrailingCaret: boolean };
  DuBoisPagination: { hasNextPage: boolean; hasPreviousPage: boolean; nextPageText: string; previousPageText: string };
  // Data Display
  DuBoisTypography: {
    text: string;
    level: number;
    variant: string;
    bold: boolean;
    color: string | undefined;
    withoutMargins: boolean;
    size: string;
  };
  DuBoisTag: { label: string; color: string; closable: boolean; icon: string };
  DuBoisEmpty: { title: string; description: string; image: string; ctaLabel: string };
  DuBoisSpinner: { label: string; size: string };
  DuBoisTableSkeleton: { lines: number };
  DuBoisParagraphSkeleton: Record<string, never>;
  DuBoisTitleSkeleton: Record<string, never>;
  DuBoisGenericSkeleton: { width: string; height: number };
  // Feedback
  DuBoisAlert: {
    message: string;
    description: string;
    type: string;
    closable: boolean;
    size: string;
    collapsible: boolean;
  };
  DuBoisTooltip: { text: string; placement: string; content?: any; maxWidth: number | undefined };
  DuBoisModal: {
    title: string;
    size: string;
    okText: string;
    cancelText: string;
    danger: boolean;
    okLoading: boolean;
    okDisabled: boolean;
    content?: any;
  };
  // Inputs
  DuBoisButton: {
    label: string;
    type: string | undefined;
    size: string;
    danger: boolean;
    disabled: boolean;
    icon: string;
    endIcon: string;
    loading: boolean;
  };
  DuBoisInput: {
    placeholder: string;
    value: string;
    label: string;
    prefix: string;
    suffix: string;
    inputType: string;
    disabled: boolean;
    required: boolean;
    validationState: string;
    allowClear: boolean;
  };
  DuBoisSimpleSelect: {
    label: string;
    placeholder: string;
    options: { label: string; value: string }[];
    validationState: string;
    disabled: boolean;
    defaultValue: string;
  };
  DuBoisSwitch: {
    label: string;
    checked: boolean;
    disabled: boolean;
    activeLabel: string;
    inactiveLabel: string;
    disabledLabel: string;
  };
  DuBoisCheckbox: { label: string; isChecked: boolean; disabled: boolean };
  DuBoisDropdownMenu: {
    triggerLabel: string;
    items: { label: string; danger: boolean; separator: boolean }[];
    minWidth: number;
  };
  // Containers
  DuBoisCard: { content?: any; width: string | number; disableHover: boolean; padding: string; loading: boolean };
  DuBoisTabs: {
    tabs: { label: string; value: string }[];
    defaultValue: string;
    tab1?: any;
    tab2?: any;
    tab3?: any;
    tab4?: any;
  };
  DuBoisTable: {
    columns: { header: string; sortable: boolean }[];
    rows: number;
    emptyText: string;
    size: string;
    scrollable: boolean;
    grid: boolean;
    noMinHeight: boolean;
  };
  DuBoisFormField: { label: string; hint: string; required: boolean; errorMessage: string; input?: any };
  DuBoisAccordion: {
    panels: { header: string }[];
    displayMode: string;
    chevronAlignment: string;
    secondaryStyle: boolean;
    panel1?: any;
    panel2?: any;
    panel3?: any;
    panel4?: any;
  };
  DuBoisDrawer: { title: string; width: number; position: string; content?: any };
  DuBoisPreviewCard: {
    title: string;
    subtitle: string;
    size: string;
    content?: any;
    disabled: boolean;
    selected: boolean;
  };
  // Additional display
  DuBoisAvatar: { label: string; type: string; size: string; backgroundColor: string };
  DuBoisBanner: { message: string; description: string; level: string; closable: boolean; ctaText: string };
  DuBoisProgress: { value: number; max: number };
  DuBoisStepper: {
    steps: { title: string; status: string; description: string }[];
    currentStepIndex: number;
    direction: string;
  };
  DuBoisHoverCard: {
    triggerText: string;
    content?: any;
    side: string;
    maxWidth: number | undefined;
    withArrow: boolean;
  };
  // Additional inputs
  DuBoisRadioGroup: {
    name: string;
    options: { label: string; value: string }[];
    layout: string;
    defaultValue: string;
    disabled: boolean;
  };
  DuBoisSegmentedControl: {
    name: string;
    options: { label: string; value: string }[];
    defaultValue: string;
    size: string;
  };
  DuBoisSlider: { min: number; max: number; step: number; defaultValue: number; label: string; disabled: boolean };
  DuBoisToggleButton: { label: string; defaultPressed: boolean; icon: string; size: string; disabled: boolean };
  DuBoisPopover: { triggerLabel: string; content?: any; side: string; align: string };
  // Page patterns
  KeyValueGrid: { rows: { label: string; value: string }[]; labelWidth: number };
  ListDetailLayout: { list?: any; detail?: any; listWidth: number };
  CodeBlock: { code: string; language: string; maxHeight: number; title: string };
  LinkText: { text: string; href: string };
  IconLabel: { text: string; icon: string };
  ListItem: { title: string; subtitle: string; selected: boolean; showChevron: boolean; icon: string };
  OverflowMenu: { items: { label: string; danger: boolean; separator: boolean }[] };
  DuBoisTextArea: {
    placeholder: string;
    label: string;
    rows: number;
    disabled: boolean;
    readOnly: boolean;
    validationState: string;
  };
  DuBoisDialogCombobox: {
    label: string;
    placeholder: string;
    multiSelect: boolean;
    options: { label: string; value: string }[];
    disabled: boolean;
  };
  DuBoisNotification: { severity: string; title: string; description: string };
};

const SLOT_MIN_HEIGHT = 60;
const SLOT_MIN_HEIGHT_COMPACT = 24;
const SLOT_MIN_HEIGHT_INLINE = 32;

const DEFAULT_SIDEBAR_WIDTH = 200;
const MODAL_WIDTHS: Record<string, number> = { normal: 480, wide: 640, extraWide: 880 };
const DEFAULT_DRAWER_WIDTH = 400;
const MAX_DRAWER_PREVIEW_WIDTH = 600;
const DEFAULT_LIST_DETAIL_WIDTH = 320;
const DEFAULT_LABEL_WIDTH = 120;
const DEFAULT_DROPDOWN_MIN_WIDTH = 150;
const DEFAULT_CODE_MAX_HEIGHT = 240;
const LIST_DETAIL_MIN_HEIGHT = 200;

const SPACING_OPTIONS = [
  { label: 'None (0)', value: 'none' },
  { label: 'XS (4px)', value: 'xs' },
  { label: 'SM (8px)', value: 'sm' },
  { label: 'MD (16px)', value: 'md' },
  { label: 'LG (24px)', value: 'lg' },
];

const resolveSpacing = (value: string, theme: any): number => {
  const map: Record<string, number> = {
    none: 0,
    xs: theme.spacing.xs,
    sm: theme.spacing.sm,
    md: theme.spacing.md,
    lg: theme.spacing.lg,
  };
  return map[value] ?? theme.spacing.md;
};

const iconMap: Record<string, React.ReactNode> = {
  none: undefined,
  home: <HomeIcon />,
  beaker: <BeakerIcon />,
  textbox: <TextBoxIcon />,
  cloud: <CloudModelIcon />,
  plus: <PlusIcon />,
  trash: <TrashIcon />,
  pencil: <PencilIcon />,
  search: <SearchIcon />,
  gear: <GearIcon />,
  play: <PlayIcon />,
  lightning: <LightningIcon />,
  copy: <CopyIcon />,
  danger: <DangerIcon />,
  overflow: <OverflowIcon />,
  user: <UserIcon />,
  arrow: <ArrowRightIcon />,
  chevronDown: <ChevronDownIcon />,
  close: <CloseIcon />,
  newWindow: <NewWindowIcon />,
  refresh: <RefreshIcon />,
  download: <DownloadIcon />,
  filter: <FilterIcon />,
  bookmark: <BookmarkIcon />,
  info: <InfoSmallIcon />,
  checkCircle: <CheckCircleIcon />,
  xCircle: <XCircleIcon />,
  check: <CheckIcon />,
  warning: <WarningIcon />,
  sparkle: <SparkleIcon />,
  clock: <ClockIcon />,
  table: <TableIcon />,
  models: <ModelsIcon />,
  dash: <DashIcon />,
  no: <NoIcon />,
  wrench: <WrenchIcon />,
  visible: <VisibleIcon />,
  visibleOff: <VisibleOffIcon />,
  code: <CodeIcon />,
  database: <DatabaseIcon />,
  file: <FileIcon />,
  chartLine: <ChartLineIcon />,
  chain: <ChainIcon />,
  notebook: <NotebookIcon />,
  workflows: <WorkflowsIcon />,
  token: <TokenIcon />,
};

const ICON_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Plus', value: 'plus' },
  { label: 'Trash', value: 'trash' },
  { label: 'Pencil', value: 'pencil' },
  { label: 'Search', value: 'search' },
  { label: 'Gear', value: 'gear' },
  { label: 'Play', value: 'play' },
  { label: 'Lightning', value: 'lightning' },
  { label: 'Copy', value: 'copy' },
  { label: 'Danger', value: 'danger' },
  { label: 'Arrow', value: 'arrow' },
  { label: 'User', value: 'user' },
  { label: 'Chevron Down', value: 'chevronDown' },
  { label: 'Close', value: 'close' },
  { label: 'New Window', value: 'newWindow' },
  { label: 'Refresh', value: 'refresh' },
  { label: 'Download', value: 'download' },
  { label: 'Filter', value: 'filter' },
  { label: 'Bookmark', value: 'bookmark' },
  { label: 'Info', value: 'info' },
  { label: 'Check Circle', value: 'checkCircle' },
  { label: 'X Circle', value: 'xCircle' },
  { label: 'Check', value: 'check' },
  { label: 'Warning', value: 'warning' },
  { label: 'Sparkle', value: 'sparkle' },
  { label: 'Clock', value: 'clock' },
  { label: 'Table', value: 'table' },
  { label: 'Models', value: 'models' },
  { label: 'Dash', value: 'dash' },
  { label: 'No', value: 'no' },
  { label: 'Wrench', value: 'wrench' },
  { label: 'Visible', value: 'visible' },
  { label: 'Visible Off', value: 'visibleOff' },
  { label: 'Code', value: 'code' },
  { label: 'Database', value: 'database' },
  { label: 'File', value: 'file' },
  { label: 'Chart Line', value: 'chartLine' },
  { label: 'Chain', value: 'chain' },
  { label: 'Notebook', value: 'notebook' },
  { label: 'Workflows', value: 'workflows' },
  { label: 'Token', value: 'token' },
];

const useEditGuideStyles = (isEditing: boolean) => {
  const { theme } = useDesignSystemTheme();
  if (!isEditing) return {};
  return {
    outline: `1px dashed ${theme.colors.borderDecorative}`,
    outlineOffset: -1,
  };
};

// ---------------------------------------------------------------------------
// Puck config
// ---------------------------------------------------------------------------
export const puckConfig: Config<PuckComponents> = {
  root: {
    fields: {
      showShell: {
        type: 'radio',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
        label: 'Show App Shell',
      },
      activeNav: { type: 'number', label: 'Active Nav (0-based index, -1 = none)', min: -1 },
      sidebarWidth: {
        type: 'number',
        label: 'Sidebar Width (px)',
        min: DEFAULT_SIDEBAR_WIDTH / 2,
        max: DEFAULT_SIDEBAR_WIDTH * 2,
      },
      contentPadding: {
        type: 'select',
        label: 'Content Padding',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Small (8px)', value: 'sm' },
          { label: 'Medium (16px)', value: 'md' },
          { label: 'Large (24px)', value: 'lg' },
        ],
      },
      showVersion: {
        type: 'radio',
        label: 'Show Version',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      navItems: {
        type: 'array',
        label: 'Sidebar Nav Items',
        arrayFields: {
          label: { type: 'text' },
          icon: {
            type: 'select',
            options: [
              { label: 'None', value: 'none' },
              { label: 'Home', value: 'home' },
              { label: 'Beaker', value: 'beaker' },
              { label: 'Text Box', value: 'textbox' },
              { label: 'Cloud/Model', value: 'cloud' },
              { label: 'Gear', value: 'gear' },
              { label: 'Search', value: 'search' },
              { label: 'User', value: 'user' },
              { label: 'Plus', value: 'plus' },
            ],
          },
        },
        getItemSummary: (item: { label: string }, index?: number) => item.label || `Nav Item ${index}`,
      },
    },
    defaultProps: {
      showShell: false,
      activeNav: 2,
      sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
      contentPadding: 'lg',
      showVersion: true,
      navItems: [
        { label: 'Home', icon: 'home' },
        { label: 'Experiments', icon: 'beaker' },
        { label: 'Prompts', icon: 'textbox' },
        { label: 'MCP Registry', icon: 'chain' },
        { label: 'AI Gateway', icon: 'cloud' },
      ],
    },
    render: ({ children, puck, ...rootProps }: any) => {
      const ShellRender = () => {
        const { theme } = useDesignSystemTheme();
        const showShell = rootProps.showShell;
        const navItems = rootProps.navItems || [];
        const activeNav = rootProps.activeNav ?? -1;
        const sidebarWidth = rootProps.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH;
        const showVersion = rootProps.showVersion ?? true;
        const paddingMap: Record<string, number> = {
          none: 0,
          sm: theme.spacing.sm,
          md: theme.spacing.md,
          lg: theme.spacing.lg,
        };
        const contentPadding = paddingMap[rootProps.contentPadding] ?? theme.spacing.lg;

        if (!showShell) return <div css={{ padding: contentPadding }}>{children}</div>;

        return (
          <div
            css={{
              display: 'flex',
              minHeight: 'calc(100vh - 54px)',
              background: `linear-gradient(163deg, rgba(66, 153, 224, 0.06) 20%, rgba(202, 66, 224, 0.06) 35%, rgba(255, 95, 70, 0.06) 50%, transparent 80%), ${theme.colors.backgroundSecondary}`,
            }}
          >
            <nav
              css={{
                width: sidebarWidth,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                padding: theme.spacing.sm,
                height: '100%',
              }}
            >
              <div
                css={{
                  padding: theme.spacing.sm,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: theme.spacing.xs,
                }}
              >
                <div>
                  <MlflowLogo css={{ display: 'block', height: theme.spacing.lg, color: theme.colors.textPrimary }} />
                  {showVersion && (
                    <Typography.Text color="secondary" css={{ fontSize: theme.typography.fontSizeSm }}>
                      3.14.1.dev0
                    </Typography.Text>
                  )}
                </div>
                <SidebarCollapseIcon css={{ color: theme.colors.textSecondary, cursor: 'pointer' }} />
              </div>
              <ul
                css={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme.spacing.xs,
                  flex: 1,
                }}
              >
                {navItems.map((item: any, i: number) => {
                  const isActive = i === activeNav;
                  return (
                    <li key={i}>
                      <div
                        css={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.sm,
                          paddingInline: theme.spacing.sm,
                          paddingBlock: theme.spacing.sm,
                          borderRadius: theme.borders.borderRadiusSm,
                          color: isActive
                            ? theme.isDarkMode
                              ? theme.colors.blue300
                              : theme.colors.blue700
                            : theme.colors.textPrimary,
                          fontWeight: isActive ? theme.typography.typographyBoldFontWeight : 'normal',
                          backgroundColor: isActive ? theme.colors.actionDefaultBackgroundPress : 'transparent',
                          fontSize: theme.typography.fontSizeMd,
                          cursor: 'pointer',
                        }}
                      >
                        {item.icon && item.icon !== 'none' && iconMap[item.icon]}
                        {item.label}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <main
              css={{
                flex: 1,
                backgroundColor: theme.colors.backgroundPrimary,
                margin: theme.spacing.sm,
                borderRadius: theme.borders.borderRadiusMd,
                boxShadow: theme.shadows.md,
                overflow: 'visible',
                padding: contentPadding,
              }}
            >
              {children}
            </main>
          </div>
        );
      };
      return <ShellRender />;
    },
  },
  categories: {
    layout: {
      title: 'Layout',
      components: ['Columns', 'Divider', 'FlexColumn', 'FlexRow', 'Rows', 'Section', 'DuBoisSpacer'],
    },
    navigation: { title: 'Navigation', components: ['DuBoisBreadcrumb', 'DuBoisHeader', 'DuBoisPagination'] },
    display: {
      title: 'Data Display',
      components: [
        'DuBoisAvatar',
        'DuBoisEmpty',
        'DuBoisGenericSkeleton',
        'DuBoisHoverCard',
        'IconLabel',
        'KeyValueGrid',
        'LinkText',
        'DuBoisParagraphSkeleton',
        'DuBoisProgress',
        'DuBoisSpinner',
        'DuBoisStepper',
        'DuBoisTableSkeleton',
        'DuBoisTag',
        'DuBoisTitleSkeleton',
        'DuBoisTypography',
      ],
    },
    feedback: {
      title: 'Feedback',
      components: ['DuBoisAlert', 'DuBoisBanner', 'DuBoisModal', 'DuBoisNotification', 'DuBoisTooltip'],
    },
    inputs: {
      title: 'Inputs',
      components: [
        'DuBoisButton',
        'DuBoisCheckbox',
        'DuBoisDialogCombobox',
        'DuBoisDropdownMenu',
        'DuBoisInput',
        'OverflowMenu',
        'DuBoisRadioGroup',
        'DuBoisSegmentedControl',
        'DuBoisSimpleSelect',
        'DuBoisSlider',
        'DuBoisSwitch',
        'DuBoisTextArea',
        'DuBoisToggleButton',
      ],
    },
    containers: {
      title: 'Containers',
      components: [
        'DuBoisAccordion',
        'DuBoisCard',
        'CodeBlock',
        'DuBoisDrawer',
        'DuBoisFormField',
        'ListDetailLayout',
        'ListItem',
        'DuBoisPopover',
        'DuBoisPreviewCard',
        'DuBoisTable',
        'DuBoisTabs',
      ],
    },
  },
  components: {
    // -----------------------------------------------------------------------
    // LAYOUT
    // -----------------------------------------------------------------------
    Columns: {
      label: 'Columns',
      fields: {
        count: { type: 'number', label: 'Number of Columns', min: 1, max: 6 },
        gap: { type: 'select', options: SPACING_OPTIONS },
        col1: { type: 'slot' },
        col2: { type: 'slot' },
        col3: { type: 'slot' },
        col4: { type: 'slot' },
        col5: { type: 'slot' },
        col6: { type: 'slot' },
      },
      defaultProps: { count: 2, gap: 'md' },
      inline: true,
      render: ({ count, gap, col1: C1, col2: C2, col3: C3, col4: C4, col5: C5, col6: C6, puck }) => {
        const { theme } = useDesignSystemTheme();
        const guideStyles = useEditGuideStyles(puck.isEditing);
        const slots = [C1, C2, C3, C4, C5, C6].slice(0, count);
        return (
          <div
            ref={puck.dragRef}
            css={{
              display: 'grid',
              gridTemplateColumns: `repeat(${count}, 1fr)`,
              gap: resolveSpacing(gap, theme),
              ...guideStyles,
            }}
          >
            {slots.map((Slot, i) => (
              <Slot key={i} minEmptyHeight={SLOT_MIN_HEIGHT} />
            ))}
          </div>
        );
      },
    },
    Rows: {
      label: 'Rows',
      fields: {
        count: { type: 'number', label: 'Number of Rows', min: 1, max: 6 },
        gap: { type: 'select', options: SPACING_OPTIONS },
        row1: { type: 'slot' },
        row2: { type: 'slot' },
        row3: { type: 'slot' },
        row4: { type: 'slot' },
        row5: { type: 'slot' },
        row6: { type: 'slot' },
      },
      defaultProps: { count: 2, gap: 'md' },
      inline: true,
      render: ({ count, gap, row1: R1, row2: R2, row3: R3, row4: R4, row5: R5, row6: R6, puck }) => {
        const { theme } = useDesignSystemTheme();
        const guideStyles = useEditGuideStyles(puck.isEditing);
        const slots = [R1, R2, R3, R4, R5, R6].slice(0, count);
        return (
          <div
            ref={puck.dragRef}
            css={{
              display: 'flex',
              flexDirection: 'column' as const,
              gap: resolveSpacing(gap, theme),
              ...guideStyles,
            }}
          >
            {slots.map((Slot, i) => (
              <Slot key={i} minEmptyHeight={SLOT_MIN_HEIGHT} />
            ))}
          </div>
        );
      },
    },
    FlexRow: {
      label: 'Flex Row',
      fields: {
        content: { type: 'slot' },
        gap: { type: 'select', options: SPACING_OPTIONS },
        justifyContent: {
          type: 'select',
          options: [
            { label: 'Start', value: 'flex-start' },
            { label: 'Center', value: 'center' },
            { label: 'End', value: 'flex-end' },
            { label: 'Space Between', value: 'space-between' },
            { label: 'Space Around', value: 'space-around' },
          ],
        },
        alignItems: {
          type: 'select',
          options: [
            { label: 'Start', value: 'flex-start' },
            { label: 'Center', value: 'center' },
            { label: 'End', value: 'flex-end' },
            { label: 'Stretch', value: 'stretch' },
          ],
        },
      },
      defaultProps: { gap: 'sm', justifyContent: 'flex-start', alignItems: 'center' },
      inline: true,
      render: ({ content: Content, gap, justifyContent, alignItems, puck }) => {
        const { theme } = useDesignSystemTheme();
        const guideStyles = useEditGuideStyles(puck.isEditing);
        const gapPx = resolveSpacing(gap, theme);
        return (
          <div
            ref={puck.dragRef}
            css={{
              ...guideStyles,
            }}
          >
            <Content
              minEmptyHeight={SLOT_MIN_HEIGHT}
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: gapPx,
                justifyContent,
                alignItems,
                width: '100%',
                flexWrap: 'wrap',
              }}
            />
          </div>
        );
      },
    },
    FlexColumn: {
      label: 'Flex Column',
      fields: {
        content: { type: 'slot' },
        gap: { type: 'select', options: SPACING_OPTIONS },
        alignItems: {
          type: 'select',
          options: [
            { label: 'Start', value: 'flex-start' },
            { label: 'Center', value: 'center' },
            { label: 'End', value: 'flex-end' },
            { label: 'Stretch', value: 'stretch' },
          ],
        },
        justifyContent: {
          type: 'select',
          options: [
            { label: 'Start', value: 'flex-start' },
            { label: 'Center', value: 'center' },
            { label: 'End', value: 'flex-end' },
            { label: 'Space Between', value: 'space-between' },
          ],
        },
      },
      defaultProps: { gap: 'sm', alignItems: 'stretch', justifyContent: 'flex-start' },
      inline: true,
      render: ({ content: Content, gap, alignItems, justifyContent, puck }) => {
        const { theme } = useDesignSystemTheme();
        const guideStyles = useEditGuideStyles(puck.isEditing);
        return (
          <div
            ref={puck.dragRef}
            css={{
              display: 'flex',
              flexDirection: 'column' as const,
              gap: resolveSpacing(gap, theme),
              alignItems,
              justifyContent,
              ...guideStyles,
            }}
          >
            <Content minEmptyHeight={SLOT_MIN_HEIGHT} />
          </div>
        );
      },
    },
    Section: {
      label: 'Section',
      fields: {
        content: { type: 'slot' },
        padding: { type: 'select', options: SPACING_OPTIONS },
        background: {
          type: 'select',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Surface', value: 'surface' },
            { label: 'Secondary', value: 'secondary' },
          ],
        },
        maxWidth: { type: 'text' },
      },
      defaultProps: { padding: 'md', background: 'none', maxWidth: 'none' },
      inline: true,
      render: ({ content: Content, padding, background, maxWidth, puck }) => {
        const SectionInner = () => {
          const { theme } = useDesignSystemTheme();
          const guideStyles = useEditGuideStyles(puck.isEditing);
          const bgMap: Record<string, string> = {
            none: 'transparent',
            surface: theme.colors.backgroundPrimary,
            secondary: theme.colors.backgroundSecondary,
          };
          return (
            <div
              ref={puck.dragRef}
              css={{
                padding: resolveSpacing(padding, theme),
                background: bgMap[background] ?? 'transparent',
                borderRadius: theme.borders.borderRadiusMd,
                ...(maxWidth !== 'none' ? { maxWidth } : {}),
                ...guideStyles,
              }}
            >
              <Content minEmptyHeight={SLOT_MIN_HEIGHT} />
            </div>
          );
        };
        return <SectionInner />;
      },
    },
    DuBoisSpacer: {
      label: 'Spacer',
      fields: {
        size: {
          type: 'select',
          options: [
            { label: 'Extra Small (4px)', value: 'xs' },
            { label: 'Small (8px)', value: 'sm' },
            { label: 'Medium (16px)', value: 'md' },
            { label: 'Large (24px)', value: 'lg' },
          ],
        },
        shrinks: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: { size: 'md', shrinks: true },
      render: ({ size, shrinks, puck }) => {
        const SpacerInner = () => {
          const { theme } = useDesignSystemTheme();
          const sizeMap: Record<string, 'xs' | 'sm' | 'md' | 'lg'> = { xs: 'xs', sm: 'sm', md: 'md', lg: 'lg' };
          if (!puck.isEditing) return <Spacer size={sizeMap[size] ?? 'md'} shrinks={shrinks} />;
          return (
            <div css={{ borderTop: `1px dashed ${theme.colors.borderDecorative}` }}>
              <Spacer size={sizeMap[size] ?? 'md'} shrinks={shrinks} />
            </div>
          );
        };
        return <SpacerInner />;
      },
    },

    Divider: {
      label: 'Divider',
      fields: {},
      defaultProps: {},
      render: () => {
        const DividerInner = () => {
          const { theme } = useDesignSystemTheme();
          return <div css={{ borderBottom: `1px solid ${theme.colors.borderDecorative}`, width: '100%' }} />;
        };
        return <DividerInner />;
      },
    },

    // -----------------------------------------------------------------------
    // NAVIGATION
    // -----------------------------------------------------------------------
    DuBoisHeader: {
      label: 'Page Header',
      fields: {
        title: { type: 'text' },
        breadcrumbs: { type: 'slot' },
        titleAddOns: { type: 'slot' },
        buttons: { type: 'slot' },
      },
      defaultProps: { title: 'Page Title' },
      inline: true,
      render: ({ title, breadcrumbs: Breadcrumbs, titleAddOns: AddOns, buttons: Buttons, puck }) => (
        <div ref={puck.dragRef} css={{ width: '100%' }}>
          <Header
            title={title}
            breadcrumbs={<Breadcrumbs minEmptyHeight={SLOT_MIN_HEIGHT_COMPACT} />}
            titleAddOns={<AddOns minEmptyHeight={0} />}
            buttons={<Buttons minEmptyHeight={0} style={{ display: 'flex', gap: '8px', alignItems: 'center' }} />}
          />
        </div>
      ),
    },
    DuBoisBreadcrumb: {
      label: 'Breadcrumb',
      fields: {
        items: {
          type: 'array',
          arrayFields: { label: { type: 'text' } },
          getItemSummary: (item: { label: string }) => item.label || 'Item',
        },
        includeTrailingCaret: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        items: [{ label: 'Home' }, { label: 'Items' }, { label: 'Detail' }],
        includeTrailingCaret: true,
      },
      render: ({ items, includeTrailingCaret }) => (
        <Breadcrumb includeTrailingCaret={includeTrailingCaret}>
          {items.map((item, i) => (
            <Breadcrumb.Item key={i}>
              <Typography.Link componentId={`page-composer.breadcrumb-link-${i}`} onClick={() => {}}>
                {item.label}
              </Typography.Link>
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      ),
    },
    DuBoisPagination: {
      label: 'Pagination',
      fields: {
        hasNextPage: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        hasPreviousPage: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        nextPageText: { type: 'text' },
        previousPageText: { type: 'text' },
      },
      defaultProps: { hasNextPage: true, hasPreviousPage: false, nextPageText: '', previousPageText: '' },
      render: ({ hasNextPage, hasPreviousPage, nextPageText, previousPageText }) => (
        <CursorPagination
          componentId="page-composer.pagination"
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          onNextPage={() => {}}
          onPreviousPage={() => {}}
          {...(nextPageText ? { nextPageText } : {})}
          {...(previousPageText ? { previousPageText } : {})}
        />
      ),
    },

    // -----------------------------------------------------------------------
    // DATA DISPLAY
    // -----------------------------------------------------------------------
    DuBoisTypography: {
      label: 'Typography',
      fields: {
        text: { type: 'textarea' },
        variant: {
          type: 'select',
          options: [
            { label: 'Title', value: 'title' },
            { label: 'Text', value: 'text' },
            { label: 'Paragraph', value: 'paragraph' },
          ],
        },
        level: {
          type: 'select',
          options: [
            { label: 'H1', value: 1 },
            { label: 'H2', value: 2 },
            { label: 'H3', value: 3 },
            { label: 'H4', value: 4 },
          ],
        },
        bold: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        color: {
          type: 'select',
          options: [
            { label: 'Default', value: '' },
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Error', value: 'error' },
            { label: 'Success', value: 'success' },
            { label: 'Warning', value: 'warning' },
            { label: 'Info', value: 'info' },
          ],
        },
        withoutMargins: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        size: {
          type: 'select',
          options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
      },
      defaultProps: {
        text: 'Hello, World!',
        variant: 'title',
        level: 2,
        bold: false,
        color: undefined,
        withoutMargins: false,
        size: 'md',
      },
      render: ({ text, variant, level, bold, color, withoutMargins, size }) => {
        if (variant === 'title')
          return (
            <Typography.Title level={level as 1 | 2 | 3 | 4} withoutMargins={withoutMargins}>
              {text}
            </Typography.Title>
          );
        if (variant === 'paragraph') return <Typography.Paragraph>{text}</Typography.Paragraph>;
        return (
          <Typography.Text bold={bold} color={(color || undefined) as any} size={size as any}>
            {text}
          </Typography.Text>
        );
      },
    },
    DuBoisTag: {
      label: 'Tag',
      fields: {
        label: { type: 'text' },
        color: {
          type: 'select',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Brown', value: 'brown' },
            { label: 'Coral', value: 'coral' },
            { label: 'Charcoal', value: 'charcoal' },
            { label: 'Indigo', value: 'indigo' },
            { label: 'Lemon', value: 'lemon' },
            { label: 'Lime', value: 'lime' },
            { label: 'Pink', value: 'pink' },
            { label: 'Purple', value: 'purple' },
            { label: 'Teal', value: 'teal' },
            { label: 'Turquoise', value: 'turquoise' },
          ],
        },
        closable: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        icon: {
          type: 'select',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Plus', value: 'plus' },
            { label: 'Trash', value: 'trash' },
            { label: 'Pencil', value: 'pencil' },
            { label: 'Search', value: 'search' },
            { label: 'Gear', value: 'gear' },
            { label: 'Play', value: 'play' },
            { label: 'Lightning', value: 'lightning' },
            { label: 'Copy', value: 'copy' },
            { label: 'Danger', value: 'danger' },
            { label: 'Arrow', value: 'arrow' },
            { label: 'User', value: 'user' },
          ],
        },
      },
      defaultProps: { label: 'Tag', color: 'default', closable: false, icon: 'none' },
      render: ({ label, color, closable, icon }) => (
        <Tag componentId="page-composer.tag" color={color as any} closable={closable} icon={iconMap[icon]}>
          {label}
        </Tag>
      ),
    },
    DuBoisEmpty: {
      label: 'Empty State',
      fields: {
        title: { type: 'text' },
        description: { type: 'textarea' },
        image: { type: 'select', options: ICON_OPTIONS },
        ctaLabel: { type: 'text', label: 'CTA Button Label' },
      },
      defaultProps: { title: 'No data', description: 'There is nothing to display here.', image: 'none', ctaLabel: '' },
      render: ({ title, description, image, ctaLabel }) => (
        <Empty
          title={title}
          description={description}
          {...(image !== 'none' ? { image: iconMap[image] as any } : {})}
          {...(ctaLabel
            ? {
                button: (
                  <Button componentId="page-composer.empty-cta" type="primary">
                    {ctaLabel}
                  </Button>
                ),
              }
            : {})}
        />
      ),
    },
    DuBoisSpinner: {
      label: 'Spinner',
      fields: {
        label: { type: 'text' },
        size: {
          type: 'select',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Default', value: 'default' },
            { label: 'Large', value: 'large' },
          ],
        },
      },
      defaultProps: { label: 'Loading...', size: 'default' },
      render: ({ label, size }) => <Spinner label={label} size={size as any} />,
    },
    DuBoisTableSkeleton: {
      label: 'Table Skeleton',
      fields: {
        lines: { type: 'number', min: 1, max: 20 },
      },
      defaultProps: { lines: 5 },
      render: ({ lines }) => (
        <TableSkeleton lines={lines} label="Loading table..." />
      ),
    },
    DuBoisParagraphSkeleton: {
      label: 'Paragraph Skeleton',
      fields: {},
      defaultProps: {},
      render: () => <ParagraphSkeleton label="Loading content..." />,
    },
    DuBoisTitleSkeleton: {
      label: 'Title Skeleton',
      fields: {},
      defaultProps: {},
      render: () => <TitleSkeleton label="Loading title..." />,
    },
    DuBoisGenericSkeleton: {
      label: 'Generic Skeleton',
      fields: {
        width: { type: 'text', label: 'Width (px or %)' },
        height: { type: 'number', label: 'Height (px)', min: 8 },
      },
      defaultProps: { width: '100%', height: 32 },
      render: ({ width, height }) => <GenericSkeleton css={{ width, height }} />,
    },

    // -----------------------------------------------------------------------
    // FEEDBACK
    // -----------------------------------------------------------------------
    DuBoisAlert: {
      label: 'Alert',
      fields: {
        message: { type: 'text' },
        description: { type: 'textarea' },
        type: {
          type: 'select',
          options: [
            { label: 'Success', value: 'success' },
            { label: 'Info', value: 'info' },
            { label: 'Warning', value: 'warning' },
            { label: 'Error', value: 'error' },
          ],
        },
        closable: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        size: {
          type: 'select',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Large', value: 'large' },
          ],
        },
        collapsible: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        message: 'Alert title',
        description: 'Alert description',
        type: 'info',
        closable: false,
        size: 'small',
        collapsible: false,
      },
      render: ({ message, description, type, closable, size, collapsible }) => (
        <Alert
          componentId="page-composer.alert"
          message={message}
          description={description}
          type={type as any}
          closable={closable}
          size={size as any}
          collapsible={collapsible}
        />
      ),
    },
    DuBoisTooltip: {
      label: 'Tooltip',
      fields: {
        text: { type: 'text' },
        placement: {
          type: 'select',
          options: [
            { label: 'Top', value: 'top' },
            { label: 'Right', value: 'right' },
            { label: 'Bottom', value: 'bottom' },
            { label: 'Left', value: 'left' },
          ],
        },
        maxWidth: { type: 'number' },
        content: { type: 'slot' },
      },
      defaultProps: { text: 'Tooltip text', placement: 'top', maxWidth: undefined },
      inline: true,
      render: ({ text, placement, maxWidth, content: Content, puck }) => {
        const TooltipInner = () => {
          const { theme } = useDesignSystemTheme();
          if (puck.isEditing) {
            return (
              <div ref={puck.dragRef}>
                <Content minEmptyHeight={SLOT_MIN_HEIGHT_INLINE} />
                <Typography.Text color="secondary" css={{ fontSize: theme.typography.fontSizeSm, fontStyle: 'italic' }}>
                  Tooltip: {text}
                </Typography.Text>
              </div>
            );
          }
          return (
            <Tooltip
              componentId="page-composer.tooltip"
              content={text}
              side={placement as any}
              {...(maxWidth !== undefined ? { maxWidth } : {})}
            >
              <span>
                <Content minEmptyHeight={SLOT_MIN_HEIGHT_INLINE} />
              </span>
            </Tooltip>
          );
        };
        return <TooltipInner />;
      },
    },
    DuBoisModal: {
      label: 'Modal (Preview)',
      fields: {
        title: { type: 'text' },
        size: {
          type: 'select',
          options: [
            { label: 'Normal', value: 'normal' },
            { label: 'Wide', value: 'wide' },
            { label: 'Extra Wide', value: 'extraWide' },
          ],
        },
        okText: { type: 'text' },
        cancelText: { type: 'text' },
        danger: {
          type: 'radio',
          label: 'Danger (Delete Confirmation)',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        okLoading: {
          type: 'radio',
          label: 'OK Button Loading',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        okDisabled: {
          type: 'radio',
          label: 'OK Button Disabled',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        content: { type: 'slot' },
      },
      defaultProps: {
        title: 'Modal Title',
        size: 'normal',
        okText: 'OK',
        cancelText: 'Cancel',
        danger: false,
        okLoading: false,
        okDisabled: false,
      },
      inline: true,
      render: ({ title, size, okText, cancelText, danger, okLoading, okDisabled, content: Content, puck }) => {
        const ModalFrame = () => {
          const { theme } = useDesignSystemTheme();
          const widthMap = MODAL_WIDTHS;
          return (
            <div
              ref={puck.dragRef}
              css={{
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                borderRadius: theme.borders.borderRadiusMd,
                padding: theme.spacing.lg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 200,
              }}
            >
              <div
                css={{
                  width: widthMap[size] ?? MODAL_WIDTHS['normal'],
                  maxWidth: '100%',
                  border: `1px solid ${theme.colors.borderDecorative}`,
                  borderRadius: theme.borders.borderRadiusMd,
                  boxShadow: theme.shadows.lg,
                  background: theme.colors.backgroundPrimary,
                  overflow: 'hidden',
                }}
              >
                <div css={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.borderDecorative}` }}>
                  <Typography.Title level={4} withoutMargins>
                    {title}
                  </Typography.Title>
                </div>
                <div css={{ padding: theme.spacing.md }}>
                  <Content minEmptyHeight={SLOT_MIN_HEIGHT} />
                </div>
                <div
                  css={{
                    padding: theme.spacing.md,
                    borderTop: `1px solid ${theme.colors.borderDecorative}`,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: theme.spacing.sm,
                  }}
                >
                  <Button componentId="page-composer.modal-cancel">{cancelText}</Button>
                  <Button
                    componentId="page-composer.modal-ok"
                    type="primary"
                    danger={danger}
                    loading={okLoading}
                    disabled={okDisabled}
                  >
                    {okText}
                  </Button>
                </div>
              </div>
            </div>
          );
        };
        return <ModalFrame />;
      },
    },

    // -----------------------------------------------------------------------
    // INPUTS
    // -----------------------------------------------------------------------
    DuBoisButton: {
      label: 'Button',
      fields: {
        label: { type: 'text' },
        icon: { type: 'select', options: ICON_OPTIONS },
        endIcon: { type: 'select', label: 'End Icon', options: ICON_OPTIONS },
        type: {
          type: 'select',
          options: [
            { label: 'Default', value: '' },
            { label: 'Primary', value: 'primary' },
            { label: 'Link', value: 'link' },
            { label: 'Tertiary', value: 'tertiary' },
          ],
        },
        size: {
          type: 'select',
          options: [
            { label: 'Middle', value: 'middle' },
            { label: 'Small', value: 'small' },
          ],
        },
        danger: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        disabled: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        loading: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        label: 'Click me',
        icon: 'none',
        endIcon: 'none',
        type: undefined,
        size: 'middle',
        danger: false,
        disabled: false,
        loading: false,
      },
      render: ({ label, icon, endIcon, type, size, danger, disabled, loading }) => (
        <Button
          componentId="page-composer.button"
          type={(type || undefined) as any}
          size={size as any}
          danger={danger}
          disabled={disabled}
          loading={loading}
          icon={iconMap[icon]}
          endIcon={iconMap[endIcon]}
          {...(!label && icon !== 'none' ? { 'aria-label': 'icon button' } : {})}
        >
          {label || undefined}
        </Button>
      ),
    },
    DuBoisInput: {
      label: 'Input',
      fields: {
        placeholder: { type: 'text' },
        value: { type: 'text' },
        label: { type: 'text' },
        prefix: {
          type: 'select',
          label: 'Prefix Icon',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Search', value: 'search' },
            { label: 'User', value: 'user' },
            { label: 'Filter', value: 'filter' },
            { label: 'Gear', value: 'gear' },
          ],
        },
        suffix: {
          type: 'select',
          label: 'Suffix Icon',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Info', value: 'info' },
            { label: 'Search', value: 'search' },
            { label: 'Gear', value: 'gear' },
          ],
        },
        inputType: {
          type: 'select',
          label: 'Type',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Number', value: 'number' },
            { label: 'Password', value: 'password' },
          ],
        },
        required: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        disabled: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        validationState: {
          type: 'select',
          options: [
            { label: 'None', value: '' },
            { label: 'Success', value: 'success' },
            { label: 'Warning', value: 'warning' },
            { label: 'Error', value: 'error' },
          ],
        },
        allowClear: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        placeholder: 'Enter text...',
        value: '',
        label: 'Label',
        prefix: 'none',
        suffix: 'none',
        inputType: 'text',
        required: false,
        disabled: false,
        validationState: '',
        allowClear: false,
      },
      render: ({
        placeholder,
        value,
        label,
        prefix,
        suffix,
        inputType,
        required,
        disabled,
        validationState,
        allowClear,
      }) => (
        <div>
          {label && (
            <FormUI.Label htmlFor="page-composer-input" required={required}>
              {label}
            </FormUI.Label>
          )}
          <Input
            componentId="page-composer.input"
            id="page-composer-input"
            placeholder={placeholder}
            value={value || undefined}
            type={inputType as any}
            disabled={disabled}
            validationState={(validationState || undefined) as any}
            allowClear={allowClear}
            {...(prefix !== 'none' ? { prefix: iconMap[prefix] } : {})}
            {...(suffix !== 'none' ? { suffix: iconMap[suffix] } : {})}
          />
        </div>
      ),
    },
    DuBoisSimpleSelect: {
      label: 'Select',
      fields: {
        label: { type: 'text' },
        placeholder: { type: 'text' },
        options: {
          type: 'array',
          arrayFields: {
            label: { type: 'text' },
            value: { type: 'text' },
          },
          getItemSummary: (item: { label: string }) => item.label || 'Option',
        },
        validationState: {
          type: 'select',
          options: [
            { label: 'None', value: '' },
            { label: 'Success', value: 'success' },
            { label: 'Warning', value: 'warning' },
            { label: 'Error', value: 'error' },
          ],
        },
        disabled: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        defaultValue: { type: 'text' },
      },
      defaultProps: {
        label: 'Select an option',
        placeholder: 'Choose...',
        options: [
          { label: 'Option 1', value: 'opt1' },
          { label: 'Option 2', value: 'opt2' },
          { label: 'Option 3', value: 'opt3' },
        ],
        validationState: '',
        disabled: false,
        defaultValue: '',
      },
      render: ({ label, placeholder, options, validationState, disabled, defaultValue }) => (
        <div>
          {label && <FormUI.Label htmlFor="page-composer-select">{label}</FormUI.Label>}
          <SimpleSelect
            componentId="page-composer.select"
            id="page-composer-select"
            placeholder={placeholder}
            validationState={(validationState || undefined) as any}
            disabled={disabled}
            {...(defaultValue ? { defaultValue } : {})}
          >
            {options.map((opt) => (
              <SimpleSelectOption key={opt.value} value={opt.value}>
                {opt.label}
              </SimpleSelectOption>
            ))}
          </SimpleSelect>
        </div>
      ),
    },
    DuBoisSwitch: {
      label: 'Switch',
      fields: {
        label: { type: 'text' },
        checked: {
          type: 'radio',
          options: [
            { label: 'On', value: true },
            { label: 'Off', value: false },
          ],
        },
        disabled: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        activeLabel: { type: 'text' },
        inactiveLabel: { type: 'text' },
        disabledLabel: { type: 'text' },
      },
      defaultProps: {
        label: 'Toggle setting',
        checked: false,
        disabled: false,
        activeLabel: '',
        inactiveLabel: '',
        disabledLabel: '',
      },
      render: ({ label, checked, disabled, activeLabel, inactiveLabel, disabledLabel }) => {
        const hasLabels = activeLabel && inactiveLabel && disabledLabel;
        return (
          <Switch
            componentId="page-composer.switch"
            label={label}
            checked={checked}
            disabled={disabled}
            {...(hasLabels ? { activeLabel, inactiveLabel, disabledLabel } : {})}
          />
        );
      },
    },
    DuBoisCheckbox: {
      label: 'Checkbox',
      fields: {
        label: { type: 'text' },
        isChecked: {
          type: 'radio',
          options: [
            { label: 'Checked', value: true },
            { label: 'Unchecked', value: false },
          ],
        },
        disabled: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: { label: 'Check this', isChecked: false, disabled: false },
      render: ({ label, isChecked, disabled }) => (
        <Checkbox componentId="page-composer.checkbox" isChecked={isChecked} isDisabled={disabled}>
          {label}
        </Checkbox>
      ),
    },
    DuBoisDropdownMenu: {
      label: 'Dropdown Menu',
      fields: {
        triggerLabel: { type: 'text' },
        items: {
          type: 'array',
          arrayFields: {
            label: { type: 'text' },
            danger: {
              type: 'radio',
              options: [
                { label: 'Yes', value: true },
                { label: 'No', value: false },
              ],
            },
            separator: {
              type: 'radio',
              options: [
                { label: 'Above', value: true },
                { label: 'None', value: false },
              ],
            },
          },
          getItemSummary: (item: { label: string }) => item.label || 'Item',
        },
        minWidth: { type: 'number' },
      },
      defaultProps: {
        triggerLabel: 'Actions',
        items: [
          { label: 'Edit', danger: false, separator: false },
          { label: 'Duplicate', danger: false, separator: false },
          { label: 'Delete', danger: true, separator: true },
        ],
        minWidth: DEFAULT_DROPDOWN_MIN_WIDTH,
      },
      render: ({ triggerLabel, items, minWidth, puck }) => {
        const MenuInner = () => {
          const { theme } = useDesignSystemTheme();
          if (puck.isEditing) {
            return (
              <div css={{ display: 'inline-flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                <Button componentId="page-composer.dropdown-trigger">{triggerLabel}</Button>
                <div
                  css={{
                    border: `1px solid ${theme.colors.borderDecorative}`,
                    borderRadius: theme.borders.borderRadiusMd,
                    overflow: 'hidden',
                    minWidth,
                  }}
                >
                  {items.map((item, i) => (
                    <React.Fragment key={i}>
                      {item.separator && <div css={{ borderTop: `1px solid ${theme.colors.borderDecorative}` }} />}
                      <div
                        css={{
                          padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                          color: item.danger ? theme.colors.textValidationDanger : theme.colors.textPrimary,
                          fontSize: theme.typography.fontSizeMd,
                        }}
                      >
                        {item.label}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button componentId="page-composer.dropdown-trigger">{triggerLabel}</Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content minWidth={minWidth}>
                {items.map((item, i) => (
                  <React.Fragment key={i}>
                    {item.separator && <DropdownMenu.Separator />}
                    <DropdownMenu.Item componentId={`page-composer.dropdown-item-${i}`} danger={item.danger}>
                      {item.label}
                    </DropdownMenu.Item>
                  </React.Fragment>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          );
        };
        return <MenuInner />;
      },
    },

    // -----------------------------------------------------------------------
    // CONTAINERS
    // -----------------------------------------------------------------------
    DuBoisCard: {
      label: 'Card',
      fields: {
        content: { type: 'slot' },
        width: { type: 'text', label: 'Width (px or %)' },
        padding: {
          type: 'select',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'None (0)', value: 'none' },
            { label: 'Small (8px)', value: 'sm' },
            { label: 'Large (24px)', value: 'lg' },
          ],
        },
        disableHover: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        loading: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: { width: '100%', padding: 'default', disableHover: true, loading: false },
      inline: true,
      render: ({ content: Content, width, padding, disableHover, loading, puck }) => {
        const CardInner = () => {
          const { theme } = useDesignSystemTheme();
          const paddingMap: Record<string, number | undefined> = {
            default: undefined,
            none: 0,
            sm: theme.spacing.sm,
            lg: theme.spacing.lg,
          };
          const paddingValue = paddingMap[padding];
          return (
            <div ref={puck.dragRef} css={{ flex: '1 1 0%', minWidth: 0, width, boxSizing: 'border-box' as const }}>
              <Card
                componentId="page-composer.card"
                disableHover={disableHover}
                loading={loading}
                css={{
                  width: '100%',
                  boxSizing: 'border-box' as const,
                  ...(paddingValue !== undefined ? { padding: paddingValue, overflow: 'hidden' } : {}),
                }}
              >
                <Content minEmptyHeight={SLOT_MIN_HEIGHT} />
              </Card>
            </div>
          );
        };
        return <CardInner />;
      },
    },
    DuBoisTabs: {
      label: 'Tabs',
      fields: {
        tabs: {
          type: 'array',
          arrayFields: {
            label: { type: 'text' },
            value: { type: 'text' },
          },
          getItemSummary: (item: { label: string }) => item.label || 'Tab',
        },
        defaultValue: { type: 'text' },
        tab1: { type: 'slot', label: 'Tab 1 Content' },
        tab2: { type: 'slot', label: 'Tab 2 Content' },
        tab3: { type: 'slot', label: 'Tab 3 Content' },
        tab4: { type: 'slot', label: 'Tab 4 Content' },
      },
      defaultProps: {
        tabs: [
          { label: 'Tab 1', value: 'tab1' },
          { label: 'Tab 2', value: 'tab2' },
        ],
        defaultValue: 'tab1',
      },
      inline: true,
      render: ({ tabs, defaultValue, tab1: Tab1, tab2: Tab2, tab3: Tab3, tab4: Tab4, puck }) => {
        const TabsInner = () => {
          const { theme } = useDesignSystemTheme();
          const slotMap = [Tab1, Tab2, Tab3, Tab4];
          return (
            <div ref={puck.dragRef} css={{ width: '100%' }}>
              <Tabs.Root componentId="page-composer.tabs" defaultValue={defaultValue || tabs[0]?.value}>
                <Tabs.List>
                  {tabs.map((tab) => (
                    <Tabs.Trigger key={tab.value} value={tab.value}>
                      {tab.label}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
                {tabs.map((tab, i) => {
                  const SlotComponent = slotMap[i];
                  return (
                    <Tabs.Content key={tab.value} value={tab.value}>
                      <div css={{ paddingTop: theme.spacing.sm }}>
                        {SlotComponent ? <SlotComponent minEmptyHeight={SLOT_MIN_HEIGHT} /> : null}
                      </div>
                    </Tabs.Content>
                  );
                })}
              </Tabs.Root>
            </div>
          );
        };
        return <TabsInner />;
      },
    },
    DuBoisTable: {
      label: 'Table',
      fields: {
        columns: {
          type: 'array',
          arrayFields: {
            header: { type: 'text' },
            sortable: {
              type: 'radio',
              options: [
                { label: 'Yes', value: true },
                { label: 'No', value: false },
              ],
            },
          },
          getItemSummary: (item: { header: string }) => item.header || 'Column',
        },
        rows: { type: 'number', min: 0, max: 20, label: 'Rows (0 = show empty state)' },
        emptyText: { type: 'text', label: 'Empty State Text' },
        size: {
          type: 'select',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Middle', value: 'middle' },
            { label: 'Small', value: 'small' },
          ],
        },
        scrollable: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        grid: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        noMinHeight: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        columns: [
          { header: 'Name', sortable: true },
          { header: 'Status', sortable: false },
          { header: 'Created', sortable: true },
          { header: 'Actions', sortable: false },
        ],
        rows: 3,
        emptyText: 'No data available.',
        size: 'default',
        scrollable: false,
        grid: false,
        noMinHeight: false,
      },
      render: ({ columns, rows, emptyText, size, scrollable, grid, noMinHeight }) => (
        <Table
          size={size as any}
          scrollable={scrollable}
          grid={grid}
          noMinHeight={noMinHeight}
          empty={rows === 0 ? <Empty description={emptyText} image={<SearchIcon />} /> : undefined}
        >
          <TableRow isHeader>
            {columns.map((col, i) => (
              <TableHeader
                key={i}
                componentId={`page-composer.table-header-${i}`}
                sortable={col.sortable}
                sortDirection="none"
                onToggleSort={() => {}}
              >
                {col.header}
              </TableHeader>
            ))}
          </TableRow>
          {Array.from({ length: rows }, (_, rowIdx) => (
            <TableRow key={rowIdx}>
              {columns.map((_, colIdx) => (
                <TableCell key={colIdx}>
                  <Typography.Text color="secondary">---</Typography.Text>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </Table>
      ),
    },
    DuBoisFormField: {
      label: 'Form Field',
      fields: {
        label: { type: 'text' },
        hint: { type: 'text' },
        required: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        errorMessage: { type: 'text' },
        input: { type: 'slot' },
      },
      defaultProps: { label: 'Field label', hint: '', required: false, errorMessage: '' },
      inline: true,
      render: ({ label, hint, required, errorMessage, input: InputSlot, puck }) => {
        const FormFieldInner = () => {
          const { theme } = useDesignSystemTheme();
          return (
            <div ref={puck.dragRef} css={{ display: 'flex', flexDirection: 'column' as const, gap: theme.spacing.xs }}>
              <FormUI.Label htmlFor="page-composer-form-field" required={required}>
                {label}
              </FormUI.Label>
              {hint && <FormUI.Hint>{hint}</FormUI.Hint>}
              <InputSlot minEmptyHeight={36} />
              {errorMessage && <FormUI.Message type="error" message={errorMessage} />}
            </div>
          );
        };
        return <FormFieldInner />;
      },
    },
    DuBoisAccordion: {
      label: 'Accordion',
      fields: {
        panels: {
          type: 'array',
          arrayFields: {
            header: { type: 'text' },
          },
          getItemSummary: (item: { header: string }) => item.header || 'Panel',
        },
        displayMode: {
          type: 'select',
          options: [
            { label: 'Single (one open)', value: 'single' },
            { label: 'Multiple (many open)', value: 'multiple' },
          ],
        },
        chevronAlignment: {
          type: 'select',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
        },
        secondaryStyle: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        panel1: { type: 'slot', label: 'Panel 1 Content' },
        panel2: { type: 'slot', label: 'Panel 2 Content' },
        panel3: { type: 'slot', label: 'Panel 3 Content' },
        panel4: { type: 'slot', label: 'Panel 4 Content' },
      },
      defaultProps: {
        panels: [{ header: 'Section 1' }, { header: 'Section 2' }, { header: 'Section 3' }],
        displayMode: 'single',
        chevronAlignment: 'left',
        secondaryStyle: false,
      },
      inline: true,
      render: ({
        panels,
        displayMode,
        chevronAlignment,
        secondaryStyle,
        panel1: P1,
        panel2: P2,
        panel3: P3,
        panel4: P4,
        puck,
      }) => {
        const slotMap = [P1, P2, P3, P4];
        return (
          <div ref={puck.dragRef} css={{ width: '100%' }}>
            <Accordion
              componentId="page-composer.accordion"
              displayMode={displayMode as any}
              defaultActiveKey={[panels[0]?.header ?? '0']}
              chevronAlignment={chevronAlignment as any}
              secondaryStyle={secondaryStyle}
            >
              {panels.map((panel, i) => {
                const SlotComponent = slotMap[i];
                return (
                  <Accordion.Panel key={panel.header || i} header={panel.header}>
                    {SlotComponent ? <SlotComponent minEmptyHeight={SLOT_MIN_HEIGHT} /> : null}
                  </Accordion.Panel>
                );
              })}
            </Accordion>
          </div>
        );
      },
    },
    DuBoisDrawer: {
      label: 'Drawer (Preview)',
      fields: {
        title: { type: 'text' },
        width: { type: 'number', min: 320 },
        position: {
          type: 'select',
          options: [
            { label: 'Right', value: 'right' },
            { label: 'Left', value: 'left' },
          ],
        },
        content: { type: 'slot' },
      },
      defaultProps: { title: 'Drawer Title', width: DEFAULT_DRAWER_WIDTH, position: 'right' },
      inline: true,
      render: ({ title, width, position, content: Content, puck }) => {
        const DrawerFrame = () => {
          const { theme } = useDesignSystemTheme();
          return (
            <div
              ref={puck.dragRef}
              css={{
                width: Math.min(width, MAX_DRAWER_PREVIEW_WIDTH),
                maxWidth: '100%',
                border: `1px solid ${theme.colors.borderDecorative}`,
                borderRadius: theme.borders.borderRadiusMd,
                boxShadow: theme.shadows.lg,
                background: theme.colors.backgroundPrimary,
                overflow: 'hidden',
              }}
            >
              <div
                css={{
                  padding: theme.spacing.md,
                  borderBottom: `1px solid ${theme.colors.borderDecorative}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <Typography.Title level={4} withoutMargins>
                    {title}
                  </Typography.Title>
                  <Typography.Text color="secondary" size="sm">
                    ({position})
                  </Typography.Text>
                </div>
                <Typography.Text color="secondary">x</Typography.Text>
              </div>
              <div css={{ padding: theme.spacing.md }}>
                <Content minEmptyHeight={SLOT_MIN_HEIGHT} />
              </div>
            </div>
          );
        };
        return <DrawerFrame />;
      },
    },
    DuBoisPreviewCard: {
      label: 'Preview Card',
      fields: {
        title: { type: 'text' },
        subtitle: { type: 'text' },
        size: {
          type: 'select',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Large', value: 'large' },
          ],
        },
        disabled: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        selected: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        content: { type: 'slot' },
      },
      defaultProps: {
        title: 'Card Title',
        subtitle: 'Card subtitle',
        size: 'default',
        disabled: false,
        selected: false,
      },
      inline: true,
      render: ({ title, subtitle, size, disabled, selected, content: Content, puck }) => (
        <div ref={puck.dragRef} css={{ width: '100%' }}>
          <PreviewCard
            componentId="page-composer.preview-card"
            title={title}
            subtitle={subtitle}
            size={size as any}
            disabled={disabled}
            selected={selected}
          >
            <Content minEmptyHeight={SLOT_MIN_HEIGHT} />
          </PreviewCard>
        </div>
      ),
    },
    DuBoisPopover: {
      label: 'Popover',
      fields: {
        triggerLabel: { type: 'text' },
        side: {
          type: 'select',
          options: [
            { label: 'Top', value: 'top' },
            { label: 'Right', value: 'right' },
            { label: 'Bottom', value: 'bottom' },
            { label: 'Left', value: 'left' },
          ],
        },
        align: {
          type: 'select',
          options: [
            { label: 'Start', value: 'start' },
            { label: 'Center', value: 'center' },
            { label: 'End', value: 'end' },
          ],
        },
        content: { type: 'slot' },
      },
      defaultProps: { triggerLabel: 'Click for details', side: 'bottom', align: 'center' },
      inline: true,
      render: ({ triggerLabel, side, align, content: Content, puck }) => {
        const PopoverInner = () => {
          const { theme } = useDesignSystemTheme();
          if (puck.isEditing) {
            return (
              <div ref={puck.dragRef} css={{ display: 'inline-flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                <Button componentId="page-composer.popover-trigger" size="small">
                  {triggerLabel}
                </Button>
                <div
                  css={{
                    border: `1px solid ${theme.colors.borderDecorative}`,
                    borderRadius: theme.borders.borderRadiusMd,
                    padding: theme.spacing.sm,
                    boxShadow: theme.shadows.md,
                    background: theme.colors.backgroundPrimary,
                  }}
                >
                  <Typography.Text
                    color="secondary"
                    css={{ fontSize: theme.typography.fontSizeSm, marginBottom: theme.spacing.xs, display: 'block' }}
                  >
                    Popover content ({side}, {align})
                  </Typography.Text>
                  <Content minEmptyHeight={SLOT_MIN_HEIGHT} />
                </div>
              </div>
            );
          }
          return (
            <Popover.Root componentId="page-composer.popover">
              <Popover.Trigger asChild>
                <Button componentId="page-composer.popover-trigger" size="small">
                  {triggerLabel}
                </Button>
              </Popover.Trigger>
              <Popover.Content side={side as any} align={align as any}>
                <Content minEmptyHeight={SLOT_MIN_HEIGHT_INLINE} />
              </Popover.Content>
            </Popover.Root>
          );
        };
        return <PopoverInner />;
      },
    },

    // -----------------------------------------------------------------------
    // ADDITIONAL DISPLAY
    // -----------------------------------------------------------------------
    DuBoisAvatar: {
      label: 'Avatar',
      fields: {
        label: { type: 'text' },
        type: {
          type: 'select',
          options: [
            { label: 'Entity', value: 'entity' },
            { label: 'User', value: 'user' },
          ],
        },
        size: {
          type: 'select',
          options: [
            { label: 'XXS', value: 'xxs' },
            { label: 'Extra Small', value: 'xs' },
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
            { label: 'Extra Large', value: 'xl' },
          ],
        },
        backgroundColor: {
          type: 'select',
          options: [
            { label: 'Indigo', value: 'indigo' },
            { label: 'Teal', value: 'teal' },
            { label: 'Pink', value: 'pink' },
            { label: 'Purple', value: 'purple' },
            { label: 'Brown', value: 'brown' },
          ],
        },
      },
      defaultProps: { label: 'User Name', type: 'entity', size: 'md', backgroundColor: 'indigo' },
      render: ({ label, type, size, backgroundColor }) => (
        <Avatar
          label={label}
          type={type as any}
          size={size as any}
          {...(type === 'entity' && backgroundColor !== 'default' ? { backgroundColor: backgroundColor as any } : {})}
        />
      ),
    },
    DuBoisBanner: {
      label: 'Banner',
      fields: {
        message: { type: 'text' },
        description: { type: 'textarea' },
        level: {
          type: 'select',
          options: [
            { label: 'Info', value: 'info' },
            { label: 'Warning', value: 'warning' },
            { label: 'Error', value: 'error' },
            { label: 'Info Light Purple', value: 'info_light_purple' },
            { label: 'Info Dark Purple', value: 'info_dark_purple' },
          ],
        },
        closable: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        ctaText: { type: 'text' },
      },
      defaultProps: {
        message: 'Important notice',
        description: 'This is a page-level banner message.',
        level: 'info',
        closable: false,
        ctaText: '',
      },
      render: ({ message, description, level, closable, ctaText }) => (
        <Banner
          componentId="page-composer.banner"
          message={message}
          description={description}
          level={level as any}
          closable={closable}
          {...(ctaText ? { ctaText, onAccept: () => {} } : {})}
        />
      ),
    },
    DuBoisProgress: {
      label: 'Progress Bar',
      fields: {
        value: { type: 'number', min: 0, max: 100 },
        max: { type: 'number', min: 1 },
      },
      defaultProps: { value: 65, max: 100 },
      render: ({ value, max }) => (
        <Progress.Root value={value} max={max}>
          <Progress.Indicator />
        </Progress.Root>
      ),
    },
    DuBoisStepper: {
      label: 'Stepper',
      fields: {
        steps: {
          type: 'array',
          arrayFields: {
            title: { type: 'text' },
            description: { type: 'text' },
            status: {
              type: 'select',
              options: [
                { label: 'Completed', value: 'completed' },
                { label: 'Loading', value: 'loading' },
                { label: 'Upcoming', value: 'upcoming' },
                { label: 'Error', value: 'error' },
                { label: 'Warning', value: 'warning' },
              ],
            },
          },
          getItemSummary: (item: { title: string }) => item.title || 'Step',
        },
        currentStepIndex: { type: 'number', min: 0 },
        direction: {
          type: 'select',
          options: [
            { label: 'Horizontal', value: 'horizontal' },
            { label: 'Vertical', value: 'vertical' },
          ],
        },
      },
      defaultProps: {
        steps: [
          { title: 'Configure', description: '', status: 'completed' },
          { title: 'Review', description: '', status: 'loading' },
          { title: 'Deploy', description: '', status: 'upcoming' },
        ],
        currentStepIndex: 1,
        direction: 'horizontal',
      },
      render: ({ steps, currentStepIndex, direction }) => (
        <Stepper
          steps={steps.map((s) => ({
            title: s.title,
            description: s.description || undefined,
            status: s.status as any,
          }))}
          currentStepIndex={currentStepIndex}
          direction={direction as any}
          localizeStepNumber={(i) => String(i + 1)}
        />
      ),
    },
    DuBoisHoverCard: {
      label: 'Hover Card',
      fields: {
        triggerText: { type: 'text' },
        content: { type: 'slot' },
        side: {
          type: 'select',
          options: [
            { label: 'Top', value: 'top' },
            { label: 'Right', value: 'right' },
            { label: 'Bottom', value: 'bottom' },
            { label: 'Left', value: 'left' },
          ],
        },
        maxWidth: { type: 'number' },
        withArrow: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        triggerText: 'Hover me',
        side: 'bottom',
        maxWidth: undefined,
        withArrow: false,
      },
      inline: true,
      render: ({ triggerText, content: Content, side, maxWidth, withArrow, puck }) => {
        const HoverCardInner = () => {
          const { theme } = useDesignSystemTheme();
          if (puck.isEditing) {
            return (
              <div ref={puck.dragRef} css={{ display: 'inline-flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                <Typography.Text css={{ textDecoration: 'underline', cursor: 'pointer' }}>
                  {triggerText}
                </Typography.Text>
                <div
                  css={{
                    border: `1px solid ${theme.colors.borderDecorative}`,
                    borderRadius: theme.borders.borderRadiusMd,
                    padding: theme.spacing.sm,
                    boxShadow: theme.shadows.md,
                    background: theme.colors.backgroundPrimary,
                  }}
                >
                  <Typography.Text
                    color="secondary"
                    css={{ fontSize: theme.typography.fontSizeSm, marginBottom: theme.spacing.xs, display: 'block' }}
                  >
                    Hover card content ({side})
                  </Typography.Text>
                  <Content minEmptyHeight={SLOT_MIN_HEIGHT} />
                </div>
              </div>
            );
          }
          return (
            <HoverCard
              trigger={
                <Typography.Text css={{ textDecoration: 'underline', cursor: 'pointer' }}>
                  {triggerText}
                </Typography.Text>
              }
              content={<Content minEmptyHeight={SLOT_MIN_HEIGHT_INLINE} />}
              side={side as any}
              {...(maxWidth !== undefined ? { maxWidth } : {})}
              {...(withArrow ? { withArrow } : {})}
            />
          );
        };
        return <HoverCardInner />;
      },
    },

    // -----------------------------------------------------------------------
    // ADDITIONAL INPUTS
    // -----------------------------------------------------------------------
    DuBoisRadioGroup: {
      label: 'Radio Group',
      fields: {
        name: { type: 'text' },
        options: {
          type: 'array',
          arrayFields: {
            label: { type: 'text' },
            value: { type: 'text' },
          },
          getItemSummary: (item: { label: string }) => item.label || 'Option',
        },
        layout: {
          type: 'select',
          options: [
            { label: 'Vertical', value: 'vertical' },
            { label: 'Horizontal', value: 'horizontal' },
          ],
        },
        defaultValue: { type: 'text' },
        disabled: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        name: 'radio-group',
        options: [
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' },
          { label: 'Option C', value: 'c' },
        ],
        layout: 'vertical',
        defaultValue: 'a',
        disabled: false,
      },
      render: ({ name, options, layout, defaultValue, disabled }) => (
        <Radio.Group
          componentId="page-composer.radio-group"
          name={name}
          layout={layout as any}
          defaultValue={defaultValue}
          disabled={disabled}
        >
          {options.map((opt) => (
            <Radio key={opt.value} value={opt.value}>
              {opt.label}
            </Radio>
          ))}
        </Radio.Group>
      ),
    },
    DuBoisSegmentedControl: {
      label: 'Segmented Control',
      fields: {
        name: { type: 'text' },
        options: {
          type: 'array',
          arrayFields: {
            label: { type: 'text' },
            value: { type: 'text' },
          },
          getItemSummary: (item: { label: string }) => item.label || 'Option',
        },
        defaultValue: { type: 'text' },
        size: {
          type: 'select',
          options: [
            { label: 'Middle', value: 'middle' },
            { label: 'Small', value: 'small' },
          ],
        },
      },
      defaultProps: {
        name: 'segmented',
        options: [
          { label: 'Grid', value: 'grid' },
          { label: 'List', value: 'list' },
          { label: 'Chart', value: 'chart' },
        ],
        defaultValue: 'grid',
        size: 'middle',
      },
      render: ({ name, options, defaultValue, size }) => (
        <SegmentedControlGroup
          componentId="page-composer.segmented"
          name={name}
          defaultValue={defaultValue}
          size={size as any}
        >
          {options.map((opt) => (
            <SegmentedControlButton key={opt.value} value={opt.value}>
              {opt.label}
            </SegmentedControlButton>
          ))}
        </SegmentedControlGroup>
      ),
    },
    DuBoisSlider: {
      label: 'Slider',
      fields: {
        label: { type: 'text' },
        min: { type: 'number' },
        max: { type: 'number' },
        step: { type: 'number', min: 1 },
        defaultValue: { type: 'number' },
        disabled: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: { label: 'Value', min: 0, max: 100, step: 1, defaultValue: 50, disabled: false },
      render: ({ label, min, max, step, defaultValue, disabled }) => (
        <div>
          {label && <FormUI.Label htmlFor="page-composer-slider">{label}</FormUI.Label>}
          <Slider.Root defaultValue={[defaultValue]} min={min} max={max} step={step} disabled={disabled}>
            <Slider.Track>
              <Slider.Range />
            </Slider.Track>
            <Slider.Thumb />
          </Slider.Root>
        </div>
      ),
    },
    DuBoisToggleButton: {
      label: 'Toggle Button',
      fields: {
        label: { type: 'text' },
        defaultPressed: {
          type: 'radio',
          options: [
            { label: 'On', value: true },
            { label: 'Off', value: false },
          ],
        },
        icon: {
          type: 'select',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Plus', value: 'plus' },
            { label: 'Trash', value: 'trash' },
            { label: 'Pencil', value: 'pencil' },
            { label: 'Search', value: 'search' },
            { label: 'Gear', value: 'gear' },
            { label: 'Play', value: 'play' },
            { label: 'Lightning', value: 'lightning' },
            { label: 'Copy', value: 'copy' },
            { label: 'Danger', value: 'danger' },
            { label: 'Arrow', value: 'arrow' },
            { label: 'User', value: 'user' },
          ],
        },
        size: {
          type: 'select',
          options: [
            { label: 'Middle', value: 'middle' },
            { label: 'Small', value: 'small' },
          ],
        },
        disabled: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: { label: 'Toggle', defaultPressed: false, icon: 'none', size: 'middle', disabled: false },
      render: ({ label, defaultPressed, icon, size, disabled }) => (
        <ToggleButton
          componentId="page-composer.toggle"
          defaultPressed={defaultPressed}
          size={size as any}
          disabled={disabled}
          {...(icon !== 'none' ? { icon: iconMap[icon] } : {})}
        >
          {label}
        </ToggleButton>
      ),
    },

    // -----------------------------------------------------------------------
    // PAGE PATTERNS (from real MLflow codebase)
    // -----------------------------------------------------------------------
    KeyValueGrid: {
      label: 'Key-Value Grid',
      fields: {
        rows: {
          type: 'array',
          arrayFields: {
            label: { type: 'text' },
            value: { type: 'text' },
          },
          getItemSummary: (item: { label: string }) => item.label || 'Row',
        },
        labelWidth: { type: 'number', min: 60, max: 300 },
      },
      defaultProps: {
        rows: [
          { label: 'Created at:', value: '2026-07-18 15:13:10' },
          { label: 'Status:', value: 'Active' },
          { label: 'Owner:', value: 'team-ml' },
        ],
        labelWidth: DEFAULT_LABEL_WIDTH,
      },
      render: ({ rows, labelWidth }) => {
        const GridInner = () => {
          const { theme } = useDesignSystemTheme();
          return (
            <div
              css={{
                display: 'grid',
                gridTemplateColumns: `${labelWidth}px 1fr`,
                gridAutoRows: `minmax(${theme.typography.lineHeightLg}, auto)`,
                alignItems: 'flex-start',
                rowGap: theme.spacing.xs,
                columnGap: theme.spacing.sm,
              }}
            >
              {rows.map((row, i) => (
                <React.Fragment key={i}>
                  <Typography.Text bold>{row.label}</Typography.Text>
                  <Typography.Text>{row.value}</Typography.Text>
                </React.Fragment>
              ))}
            </div>
          );
        };
        return <GridInner />;
      },
    },
    ListDetailLayout: {
      label: 'List-Detail Layout',
      fields: {
        list: { type: 'slot' },
        detail: { type: 'slot' },
        listWidth: { type: 'number', min: 200, max: 500 },
      },
      defaultProps: { listWidth: DEFAULT_LIST_DETAIL_WIDTH },
      inline: true,
      render: ({ list: List, detail: Detail, listWidth, puck }) => {
        const LayoutInner = () => {
          const { theme } = useDesignSystemTheme();
          return (
            <div
              ref={puck.dragRef}
              css={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: LIST_DETAIL_MIN_HEIGHT }}
            >
              <div css={{ flex: `0 0 ${listWidth}px`, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                <List minEmptyHeight={SLOT_MIN_HEIGHT} />
              </div>
              <div
                css={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  borderLeft: `1px solid ${theme.colors.border}`,
                  overflow: 'auto',
                }}
              >
                <Detail minEmptyHeight={SLOT_MIN_HEIGHT} />
              </div>
            </div>
          );
        };
        return <LayoutInner />;
      },
    },
    CodeBlock: {
      label: 'Code Block',
      fields: {
        code: { type: 'textarea' },
        language: {
          type: 'select',
          options: [
            { label: 'Python', value: 'python' },
            { label: 'JSON', value: 'json' },
            { label: 'JavaScript', value: 'javascript' },
            { label: 'SQL', value: 'sql' },
            { label: 'YAML', value: 'yaml' },
            { label: 'Plain Text', value: 'text' },
          ],
        },
        maxHeight: { type: 'number' },
        title: { type: 'text' },
      },
      defaultProps: {
        code: 'print("Hello, World!")',
        language: 'python',
        maxHeight: DEFAULT_CODE_MAX_HEIGHT,
        title: '',
      },
      render: ({ code, language, maxHeight, title }) => {
        const CodeInner = () => {
          const { theme } = useDesignSystemTheme();
          return (
            <div>
              {title && (
                <div
                  css={{
                    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderRadius: `${theme.borders.borderRadiusSm}px ${theme.borders.borderRadiusSm}px 0 0`,
                    borderBottom: `1px solid ${theme.colors.borderDecorative}`,
                  }}
                >
                  <Typography.Text bold size="sm">
                    {title}
                  </Typography.Text>
                </div>
              )}
              <pre
                css={{
                  margin: 0,
                  padding: theme.spacing.sm,
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderRadius: title
                    ? `0 0 ${theme.borders.borderRadiusSm}px ${theme.borders.borderRadiusSm}px`
                    : theme.borders.borderRadiusSm,
                  fontSize: theme.typography.fontSizeSm,
                  overflow: 'auto',
                  maxHeight,
                }}
              >
                <code data-language={language}>{code}</code>
              </pre>
            </div>
          );
        };
        return <CodeInner />;
      },
    },
    LinkText: {
      label: 'Link Text',
      fields: {
        text: { type: 'text' },
        href: { type: 'text' },
      },
      defaultProps: { text: 'Click here', href: '' },
      render: ({ text, href, puck }) => {
        if (href && !puck.isEditing) {
          return (
            <a href={href}>
              <Typography.Link componentId="page-composer.link" onClick={() => {}}>
                {text}
              </Typography.Link>
            </a>
          );
        }
        return (
          <Typography.Link componentId="page-composer.link" onClick={() => {}}>
            {text}
          </Typography.Link>
        );
      },
    },
    IconLabel: {
      label: 'Icon + Label',
      fields: {
        text: { type: 'text' },
        icon: {
          type: 'select',
          options: [
            { label: 'Gear', value: 'gear' },
            { label: 'User', value: 'user' },
            { label: 'Search', value: 'search' },
            { label: 'Play', value: 'play' },
            { label: 'Plus', value: 'plus' },
            { label: 'Lightning', value: 'lightning' },
            { label: 'Copy', value: 'copy' },
            { label: 'Pencil', value: 'pencil' },
            { label: 'Trash', value: 'trash' },
            { label: 'Danger', value: 'danger' },
          ],
        },
      },
      defaultProps: { text: 'Section Title', icon: 'gear' },
      render: ({ text, icon }) => {
        const IconLabelInner = () => {
          const { theme } = useDesignSystemTheme();
          return (
            <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
              <div
                css={{
                  width: theme.general.iconSize,
                  height: theme.general.iconSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: theme.borders.borderRadiusSm,
                  background: theme.colors.backgroundSecondary,
                  flexShrink: 0,
                }}
              >
                {iconMap[icon]}
              </div>
              <Typography.Text bold>{text}</Typography.Text>
            </div>
          );
        };
        return <IconLabelInner />;
      },
    },
    ListItem: {
      label: 'List Item',
      fields: {
        title: { type: 'text' },
        subtitle: { type: 'text' },
        selected: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showChevron: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        icon: {
          type: 'select',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Plus', value: 'plus' },
            { label: 'Trash', value: 'trash' },
            { label: 'Pencil', value: 'pencil' },
            { label: 'Search', value: 'search' },
            { label: 'Gear', value: 'gear' },
            { label: 'Play', value: 'play' },
            { label: 'Lightning', value: 'lightning' },
            { label: 'Copy', value: 'copy' },
            { label: 'Danger', value: 'danger' },
            { label: 'Arrow', value: 'arrow' },
            { label: 'User', value: 'user' },
          ],
        },
      },
      defaultProps: {
        title: 'Version 1',
        subtitle: '07/18/2026, 03:13 PM',
        selected: false,
        showChevron: true,
        icon: 'none',
      },
      render: ({ title, subtitle, selected, showChevron, icon }) => {
        const ListItemInner = () => {
          const { theme } = useDesignSystemTheme();
          return (
            <div
              css={{
                display: 'flex',
                alignItems: 'center',
                padding: theme.spacing.sm,
                backgroundColor: selected ? theme.colors.actionDefaultBackgroundPress : 'transparent',
                cursor: 'pointer',
                gap: theme.spacing.sm,
                '&:hover': {
                  backgroundColor: selected
                    ? theme.colors.actionDefaultBackgroundPress
                    : theme.colors.actionDefaultBackgroundHover,
                },
              }}
            >
              {icon !== 'none' && iconMap[icon]}
              <div css={{ flex: 1, display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                <Typography.Text bold>{title}</Typography.Text>
                <Typography.Text size="sm" color="secondary">
                  {subtitle}
                </Typography.Text>
              </div>
              {showChevron && <ChevronRightIcon css={{ color: theme.colors.textSecondary }} />}
            </div>
          );
        };
        return <ListItemInner />;
      },
    },
    OverflowMenu: {
      label: 'Overflow Menu',
      fields: {
        items: {
          type: 'array',
          arrayFields: {
            label: { type: 'text' },
            danger: {
              type: 'radio',
              options: [
                { label: 'Yes', value: true },
                { label: 'No', value: false },
              ],
            },
            separator: {
              type: 'radio',
              options: [
                { label: 'Above', value: true },
                { label: 'None', value: false },
              ],
            },
          },
          getItemSummary: (item: { label: string }) => item.label || 'Item',
        },
      },
      defaultProps: {
        items: [
          { label: 'Rename', danger: false, separator: false },
          { label: 'Delete', danger: true, separator: true },
        ],
      },
      render: ({ items, puck }) => {
        const OverflowInner = () => {
          const { theme } = useDesignSystemTheme();
          if (puck.isEditing) {
            return (
              <div css={{ display: 'inline-flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                <Button componentId="page-composer.overflow" icon={<OverflowIcon />} aria-label="More actions" />
                <div
                  css={{
                    border: `1px solid ${theme.colors.borderDecorative}`,
                    borderRadius: theme.borders.borderRadiusMd,
                    overflow: 'hidden',
                  }}
                >
                  {items.map((item, i) => (
                    <React.Fragment key={i}>
                      {item.separator && <div css={{ borderTop: `1px solid ${theme.colors.borderDecorative}` }} />}
                      <div
                        css={{
                          padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                          color: item.danger ? theme.colors.textValidationDanger : theme.colors.textPrimary,
                          fontSize: theme.typography.fontSizeMd,
                        }}
                      >
                        {item.label}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button componentId="page-composer.overflow" icon={<OverflowIcon />} aria-label="More actions" />
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                {items.map((item, i) => (
                  <React.Fragment key={i}>
                    {item.separator && <DropdownMenu.Separator />}
                    <DropdownMenu.Item componentId={`page-composer.overflow-item-${i}`} danger={item.danger}>
                      {item.label}
                    </DropdownMenu.Item>
                  </React.Fragment>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          );
        };
        return <OverflowInner />;
      },
    },

    DuBoisTextArea: {
      label: 'Text Area',
      fields: {
        label: { type: 'text' },
        placeholder: { type: 'text' },
        rows: { type: 'number', min: 1, max: 20 },
        disabled: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        readOnly: {
          type: 'radio',
          label: 'Read Only',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        validationState: {
          type: 'select',
          options: [
            { label: 'None', value: '' },
            { label: 'Success', value: 'success' },
            { label: 'Warning', value: 'warning' },
            { label: 'Error', value: 'error' },
          ],
        },
      },
      defaultProps: {
        label: 'Label',
        placeholder: 'Enter text...',
        rows: 3,
        disabled: false,
        readOnly: false,
        validationState: '',
      },
      render: ({ label, placeholder, rows, disabled, readOnly, validationState }) => (
        <div>
          {label && <FormUI.Label htmlFor="page-composer-textarea">{label}</FormUI.Label>}
          <Input.TextArea
            componentId="page-composer.textarea"
            id="page-composer-textarea"
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            readOnly={readOnly}
            validationState={(validationState || undefined) as any}
          />
        </div>
      ),
    },

    DuBoisDialogCombobox: {
      label: 'Combobox',
      fields: {
        label: { type: 'text' },
        placeholder: { type: 'text' },
        multiSelect: {
          type: 'radio',
          label: 'Multi-select',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        options: {
          type: 'array',
          arrayFields: {
            label: { type: 'text' },
            value: { type: 'text' },
          },
          getItemSummary: (item: { label: string }) => item.label || 'Option',
        },
        disabled: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        label: 'Select',
        placeholder: 'Choose an option...',
        multiSelect: false,
        options: [
          { label: 'Option 1', value: 'opt1' },
          { label: 'Option 2', value: 'opt2' },
          { label: 'Option 3', value: 'opt3' },
        ],
        disabled: false,
      },
      render: ({ label, placeholder, multiSelect, options, disabled, puck }) => {
        const ComboboxPreview = () => {
          const { theme } = useDesignSystemTheme();
          if (puck.isEditing) {
            return (
              <div ref={puck.dragRef}>
                {label && <FormUI.Label htmlFor="page-composer-combobox">{label}</FormUI.Label>}
                <div
                  css={{
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borders.borderRadiusMd,
                    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                    color: theme.colors.textPlaceholder,
                    fontSize: theme.typography.fontSizeSm,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  {placeholder}
                  <ChevronDownIcon css={{ color: theme.colors.textSecondary }} />
                </div>
                <div
                  css={{
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borders.borderRadiusMd,
                    boxShadow: theme.shadows.md,
                    overflow: 'hidden',
                  }}
                >
                  <div css={{ padding: theme.spacing.xs, borderBottom: `1px solid ${theme.colors.borderDecorative}` }}>
                    <div
                      css={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.xs,
                        padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borders.borderRadiusMd,
                        fontSize: theme.typography.fontSizeSm,
                        color: theme.colors.textPlaceholder,
                      }}
                    >
                      <SearchIcon css={{ flexShrink: 0 }} />
                      Search...
                    </div>
                  </div>
                  {options.map((opt, i) => (
                    <div
                      key={i}
                      css={{
                        padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                        fontSize: theme.typography.fontSizeSm,
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.sm,
                      }}
                    >
                      {multiSelect ? (
                        <div
                          css={{
                            width: 14,
                            height: 14,
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: 2,
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          css={{
                            width: 14,
                            height: 14,
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: '50%',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div>
              {label && <FormUI.Label htmlFor="page-composer-combobox">{label}</FormUI.Label>}
              <DialogCombobox label={label} value={[]} componentId="page-composer.combobox">
                <DialogComboboxTrigger placeholder={placeholder} disabled={disabled} />
                <DialogComboboxContent>
                  <DialogComboboxOptionList>
                    {options.map((opt) =>
                      multiSelect ? (
                        <DialogComboboxOptionListCheckboxItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </DialogComboboxOptionListCheckboxItem>
                      ) : (
                        <DialogComboboxOptionListSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </DialogComboboxOptionListSelectItem>
                      ),
                    )}
                  </DialogComboboxOptionList>
                </DialogComboboxContent>
              </DialogCombobox>
            </div>
          );
        };
        return <ComboboxPreview />;
      },
    },

    DuBoisNotification: {
      label: 'Notification',
      fields: {
        severity: {
          type: 'select',
          options: [
            { label: 'Info', value: 'info' },
            { label: 'Success', value: 'success' },
            { label: 'Warning', value: 'warning' },
            { label: 'Error', value: 'error' },
          ],
        },
        title: { type: 'text' },
        description: { type: 'text' },
      },
      defaultProps: { severity: 'success', title: 'Operation completed', description: '' },
      render: ({ severity, title, description }) => (
        <Notification.Provider>
          <Notification.Root
            severity={severity as any}
            componentId="page-composer.notification"
            open
            onOpenChange={() => {}}
          >
            <Notification.Title>{title}</Notification.Title>
            {description && <Notification.Description>{description}</Notification.Description>}
          </Notification.Root>
          <Notification.Viewport css={{ position: 'relative', top: 0, right: 0 }} />
        </Notification.Provider>
      ),
    },
  },
};
