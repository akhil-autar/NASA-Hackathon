interface Props {
  count: number;
  max?: number;
}

/** A row of stars. Earned stars are gold; the rest are dim. */
export function Stars({ count, max = 3 }: Props) {
  const stars = [];
  for (let i = 0; i < Math.max(max, count); i++) {
    stars.push(
      <span key={i} className={i < count ? "star on" : "star off"}>
        ★
      </span>,
    );
  }
  return (
    <div className="stars" aria-label={`${count} of ${max} stars`}>
      {stars}
    </div>
  );
}
