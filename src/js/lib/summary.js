/** Replace a <dl>'s rows with [term, value] pairs, written as text. */
export function fillSummary(dl, rows, doc = document) {
  dl.replaceChildren(
    ...rows.map(([term, value]) => {
      const row = doc.createElement('div');
      const dt = doc.createElement('dt');
      const dd = doc.createElement('dd');
      dt.textContent = term;
      dd.textContent = value;
      row.append(dt, dd);
      return row;
    }),
  );
}
