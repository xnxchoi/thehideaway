FROM postgres:18rc1-alpine
COPY nanoid.sql /docker-entrypoint-initdb.d/