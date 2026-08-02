import NodeCache from "node-cache";

// Cache com TTL padrão de 10 minutos (600 segundos) e verificação a cada 2 minutos
export const appCache = new NodeCache({
  stdTTL: 600,
  checkperiod: 120,
  useClones: false,
});
