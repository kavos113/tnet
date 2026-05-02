import { EditorWorkspace } from './editor/EditorWorkspace';

export interface MarkdownAppProps {
  onOpenPdfLink?: (href: string) => void;
}

export const MarkdownApp = ({ onOpenPdfLink }: MarkdownAppProps): React.JSX.Element => (
  <EditorWorkspace onOpenPdfLink={onOpenPdfLink} />
);
