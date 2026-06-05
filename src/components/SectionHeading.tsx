import type { ElementType, ReactNode } from 'react'
import styles from './SectionHeading.module.css'

interface SectionHeadingProps {
  children: ReactNode
  /** Element to render as — use a heading (h2/h3) where this is semantically a section title,
   *  'label' (with htmlFor) for a form field, or the default 'p' for an eyebrow label. */
  as?: ElementType
  htmlFor?: string
}

/**
 * Telemetry-style section label used across screens: renders "// LABEL" (the slashes are
 * decorative, added in CSS) followed by a trailing HUD line. One source of truth for headings.
 */
export function SectionHeading({ children, as: Tag = 'p', htmlFor }: SectionHeadingProps) {
  return (
    <Tag className={styles.heading} htmlFor={htmlFor}>
      <span className={styles.text}>{children}</span>
    </Tag>
  )
}
