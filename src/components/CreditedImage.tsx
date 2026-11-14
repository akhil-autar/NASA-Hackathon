import credits from "../content/image-credits.json";

interface Props {
  /** The file path under public/, e.g. "img/base-site-map.jpg". */
  file: string;
  alt: string;
  className?: string;
}

/**
 * A real NASA image with its credit shown underneath. Credit text is read from
 * image-credits.json so it matches the data page. No NASA logo is used.
 */
export function CreditedImage({ file, alt, className }: Props) {
  const info = credits.images.find((i) => i.file === file);
  return (
    <figure className={className ? `credited-image ${className}` : "credited-image"}>
      <img src={`/${file}`} alt={alt} loading="lazy" />
      {info && (
        <figcaption>
          {info.title} — {info.credit}
        </figcaption>
      )}
    </figure>
  );
}
