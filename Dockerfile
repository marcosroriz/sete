FROM httpd:2.4
ENV APACHE_LOCK_DIR="/var/lock"
ENV APACHE_PID_FILE="/var/run/apache2.pid"
ENV APACHE_RUN_USER="www-data"
ENV APACHE_RUN_GROUP="www-data"
ENV APACHE_LOG_DIR="/var/log/apache2"

VOLUME /usr/local/apache2/htdocs
USER root
WORKDIR /usr/local/apache2/htdocs


LABEL description="Sete Web"
LABEL version="1.0.0"

EXPOSE 80
