export const getStrapiHeaders = () => ({
  Authorization: `Bearer ${process.env.STRAPI_TOKEN}`,
});

export const getStrapiUrl = (endpoint: string) => {
  const base = process.env.STRAPI_URL || 'http://localhost:1337';
  return `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
};