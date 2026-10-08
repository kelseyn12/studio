export function VideoPlaceSelect({
  value,
  deals,
}: {
  value?: string;
  deals: Array<{ id: string; label: string }>;
}) {
  return (
    <select name="place" defaultValue={value || "personal"} className="field">
      <option value="personal">Personal</option>
      <option value="brand">Brand work</option>
      <option value="trybe">Trybe</option>
      {deals.map((deal) => (
        <option key={deal.id} value={deal.id}>
          {deal.label}
        </option>
      ))}
    </select>
  );
}
