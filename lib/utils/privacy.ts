export const sanitizeWebsiteData = (url: string) => {
  const urlObj = new URL(url);
  return {
    domain: urlObj.hostname,
    path: urlObj.pathname.split("/")[1] || "",
    isCheckout: urlObj.pathname.toLowerCase().includes("checkout"),
  };
};

export const anonymizeContributor = () => {
  return `anon_${Math.random().toString(36).substr(2, 9)}`;
};
