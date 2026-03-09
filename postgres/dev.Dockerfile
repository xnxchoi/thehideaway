FROM postgres:latest
COPY nanoid.sql /docker-entrypoint-initdb.d/