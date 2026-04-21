export type CTAAudience = "adult" | "minor" | "b2b" | "all";

export interface CTAProps {
  audience?: CTAAudience;
  variant?: string;
  blockKey?: string;
  className?: string;
}

export interface CTAResolvedResponse {
  key: string;
  component: string;
  variant: string;
  audience: string;
  label: string;
  props: Record<string, unknown>;
}
