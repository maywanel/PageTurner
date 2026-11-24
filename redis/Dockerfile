FROM redis:7-alpine

EXPOSE 6379
CMD ["redis-server", "--protected-mode", "no", "--bind", "0.0.0.0", "--daemonize", "no", "--maxmemory", "256mb", "--maxmemory-policy", "allkeys-lru"]
