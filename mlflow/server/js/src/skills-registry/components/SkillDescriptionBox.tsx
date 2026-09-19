import { Button, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { useLayoutEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { textClampStyles } from '../styles';

/** The measure prose is capped at, matching `SkillFilesTab` and `SkillObservabilityTab`. */
const MAX_DESCRIPTION_WIDTH = 720;

/** Lines shown before the description is folded away behind the toggle. */
const COLLAPSED_LINES = 2;

/**
 * The skill's description under the page title, as muted body copy clamped to two lines
 * with a Read more / Show less toggle.
 *
 * Read-only. Editing is the kebab menu's "Edit" modal, which is where name, description and
 * icon are already edited together. That modal's own rule is that a field belongs in one
 * editor -- it deliberately omits tags because tags have their own -- and description was
 * the field breaking it, reachable from both a pencil here and the modal there.
 *
 * The type is the MCP server details page's: `color="secondary"` at the DEFAULT size, which
 * is DuBois' 13/20 base step. Deliberately not `size="sm"` -- that is the 12/16 step, a
 * pixel small against what the MCP page renders.
 *
 * Whether the toggle appears is MEASURED, not guessed from character count: the clamp is
 * `-webkit-line-clamp`, so what overflows depends on the rendered width and where the text
 * happens to wrap. A length threshold would show "Read more" on text that already fits at a
 * wide window, and hide it on text that does not at a narrow one.
 *
 * `CollapsibleContainer` in `common/components` does the same job in outline, but it is
 * built for a 150px block: it fades the cut with a gradient, which over two lines is more
 * chrome than content, and it carries a hard-coded Databricks discovery `componentId` that
 * would misattribute clicks from this page.
 */
export const SkillDescriptionBox = ({ description }: { description?: string }) => {
  const { theme } = useDesignSystemTheme();
  const textRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element) {
      return undefined;
    }
    const measure = () => {
      /*
        Only meaningful while clamped. Expanding removes the clamp, so the element then
        measures as fitting, and re-reading it there would delete the toggle the moment it
        was used. The last collapsed reading stands until the text collapses again.
      */
      if (isExpanded) {
        return;
      }
      // A pixel of tolerance: sub-pixel line heights make scrollHeight exceed clientHeight
      // by a fraction on text that fits exactly.
      setIsOverflowing(element.scrollHeight > element.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [description, isExpanded]);

  return (
    <div css={{ maxWidth: MAX_DESCRIPTION_WIDTH, marginBottom: theme.spacing.sm }}>
      {/*
        The clamp lives on this wrapper rather than on `Typography.Text`: `-webkit-box`
        has to be the display of the block that holds the lines, and the wrapper is also
        what the observer measures.
      */}
      <div ref={textRef} css={{ minWidth: 0, ...(isExpanded ? {} : textClampStyles(COLLAPSED_LINES)) }}>
        {description ? (
          <Typography.Text color="secondary">{description}</Typography.Text>
        ) : (
          <Typography.Text color="secondary">
            <FormattedMessage
              defaultMessage="No description"
              description="Skills registry > skill page > placeholder shown when a skill has no description"
            />
          </Typography.Text>
        )}
      </div>
      {isOverflowing && (
        <Button
          componentId="mlflow.skills-registry.skill-page.description.toggle"
          type="link"
          size="small"
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          {isExpanded ? (
            <FormattedMessage
              defaultMessage="Show less"
              description="Skills registry > skill page > collapses a long description"
            />
          ) : (
            <FormattedMessage
              defaultMessage="Read more"
              description="Skills registry > skill page > expands a truncated description"
            />
          )}
        </Button>
      )}
    </div>
  );
};
