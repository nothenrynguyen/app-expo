import { ViewTransition } from "react";

export function PageTransition({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ViewTransition enter="page-dissolve" exit="page-dissolve" default="none">
      {children}
    </ViewTransition>
  );
}
