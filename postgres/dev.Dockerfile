FROM postgres:18beta2-alpine
COPY nanoid.sql /docker-entrypoint-initdb.d/