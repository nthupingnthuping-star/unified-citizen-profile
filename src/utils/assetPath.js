export const assetPath = (path) => {
  const base = process.env.PUBLIC_URL || '';
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}`;
};