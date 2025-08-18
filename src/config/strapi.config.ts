export const getStrapiHeaders = () => ({
  Authorization: `Bearer ${process.env.STRAPI_TOKEN}`,
});

export const getStrapiUrl = (endpoint: string) => {
  const base = process.env.STRAPI_URL || 'http://localhost:1337';

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  return `${base}/api/${cleanEndpoint}`;
};