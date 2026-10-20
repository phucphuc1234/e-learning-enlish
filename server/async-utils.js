// Sequential collection helpers also work inside a SQL Server transaction's connection.
export async function mapAsync(rows, fn) {
  const result = [];
  for (let i = 0; i < rows.length; i++) result.push(await fn(rows[i], i));
  return result;
}
export async function filterAsync(rows, fn) {
  const result = [];
  for (let i = 0; i < rows.length; i++)
    if (await fn(rows[i], i)) result.push(rows[i]);
  return result;
}
export async function findAsync(rows, fn) {
  for (let i = 0; i < rows.length; i++)
    if (await fn(rows[i], i)) return rows[i];
}
export async function someAsync(rows, fn) {
  return (await findAsync(rows, fn)) !== undefined;
}
export async function forEachAsync(rows, fn) {
  for (let i = 0; i < rows.length; i++) await fn(rows[i], i);
}
export async function flatMapAsync(rows, fn) {
  return (await mapAsync(rows, fn)).flat();
}
