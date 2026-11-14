import { Button } from "./Button";
import { CreditedImage } from "./CreditedImage";
import { Icon } from "./Icon";

interface Props {
  title: string;
  /** A real Mars photo across the top. */
  headerImage?: string;
  headerAlt?: string;
  onBack: () => void;
  children: React.ReactNode;
}

/**
 * A readable text page: a real Mars photo across the top, then one column 60 to
 * 70 characters wide.
 */
export function TextPage({ title, headerImage, headerAlt, onBack, children }: Props) {
  return (
    <div className="text-page">
      {headerImage && (
        <CreditedImage
          file={headerImage}
          alt={headerAlt ?? ""}
          className="text-page-header"
        />
      )}
      <div className="text-page-body">
        <Button onClick={onBack} className="text-page-back">
          <Icon name="back" />
          Back
        </Button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
