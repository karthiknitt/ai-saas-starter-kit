'use client';

import { useMemo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

/**
 * Renders a fieldset container with a data-slot attribute and default layout classes.
 *
 * @returns A `fieldset` element with `data-slot="field-set"` and composed class names for column layout and gap rules
 */
function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        'flex flex-col gap-6',
        'has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders a legend element with variant-aware styling and data attributes for slot-based composition.
 *
 * @param variant - Controls visual variant: `'legend'` applies base text size, `'label'` applies smaller text size; value is also set on the `data-variant` attribute
 * @returns A `legend` element with `data-slot="field-legend"`, `data-variant` set to `variant`, and classes that adjust typography and spacing
 */
function FieldLegend({
  className,
  variant = 'legend',
  ...props
}: React.ComponentProps<'legend'> & { variant?: 'legend' | 'label' }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        'mb-3 font-medium',
        'data-[variant=legend]:text-base',
        'data-[variant=label]:text-sm',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders a div that groups related field sub-elements and exposes a styling hook via `data-slot="field-group"`.
 *
 * The element applies layout and spacing utility classes and merges any provided `className` and other div props.
 *
 * @returns A div element with `data-slot="field-group"` and composed class names for grouping, layout, and responsive gaps.
 */
function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        'group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4',
        className,
      )}
      {...props}
    />
  );
}

const fieldVariants = cva(
  'group/field flex w-full gap-3 data-[invalid=true]:text-destructive',
  {
    variants: {
      orientation: {
        vertical: ['flex-col [&>*]:w-full [&>.sr-only]:w-auto'],
        horizontal: [
          'flex-row items-center',
          '[&>[data-slot=field-label]]:flex-auto',
          'has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
        ],
        responsive: [
          'flex-col [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto',
          '@md/field-group:[&>[data-slot=field-label]]:flex-auto',
          '@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
        ],
      },
    },
    defaultVariants: {
      orientation: 'vertical',
    },
  },
);

/**
 * Renders a field container that groups related form elements and applies orientation-aware styling.
 *
 * @param className - Additional class names merged with the component's generated classes.
 * @param orientation - Layout orientation: 'vertical' stacks content, 'horizontal' arranges content inline.
 * @returns A div with role="group", data-slot="field", a data-orientation attribute, and classes composed from the selected orientation and `className`.
 */
function Field({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

/**
 * Renders a container element for field content with predefined layout and slot metadata.
 *
 * @returns A `div` element with `data-slot="field-content"`, utility classes for flexible vertical stacking and gap spacing, and any merged `className` and props.
 */
function FieldContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        'group/field-content flex flex-1 flex-col gap-1.5 leading-snug',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders a Label configured as a field label with slot metadata and composed styling hooks.
 *
 * @returns A Label element with `data-slot="field-label"` and a composed `className` that applies field-label layout, state, and group styling.
 */
function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        'group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50',
        'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4',
        'has-data-[state=checked]:bg-primary/5 has-data-[state=checked]:border-primary dark:has-data-[state=checked]:bg-primary/10',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders a compact title element scoped to a field label.
 *
 * @returns A div element with `data-slot="field-label"` and classes that align it inline, set typography and spacing, and reduce opacity when the field is disabled.
 */
function FieldTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        'flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders the descriptive text for a field with the appropriate data-slot and styling.
 *
 * @returns A `p` element configured as the field description (`data-slot="field-description"`) with utility classes for typography, link styling, and orientation-aware layout.
 */
function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        'text-muted-foreground text-sm leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance',
        'last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5',
        '[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders a visual separator for a field with optional centered content.
 *
 * @param children - Optional content to display centered over the separator (renders inside a span with `data-slot="field-separator-content"`).
 * @param className - Additional CSS classes applied to the separator container.
 * @returns A `div` element containing an absolute-positioned `Separator` and, when `children` is provided, a centered content span.
 */
function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  children?: React.ReactNode;
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        'relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2',
        className,
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="bg-background text-muted-foreground relative mx-auto block w-fit px-2"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

/**
 * Renders field-level error content and applies ARIA alert semantics.
 *
 * If `children` is provided it is used as the content. Otherwise `errors` is used:
 * a single error with a `message` renders that message; multiple errors render as a bulleted list of messages.
 *
 * @param errors - Optional array of error-like objects; each item may include a `message` string to display.
 * @returns A `div` element with `role="alert"` and `data-slot="field-error"` containing the computed error content, or `null` when there is no content to display.
 */
function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<'div'> & {
  errors?: Array<{ message?: string } | undefined>;
}) {
  const content = useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors) {
      return null;
    }

    if (errors?.length === 1 && errors[0]?.message) {
      return errors[0].message;
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {errors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>,
        )}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn('text-destructive text-sm font-normal', className)}
      {...props}
    >
      {content}
    </div>
  );
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
};