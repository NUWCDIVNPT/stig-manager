FROM debian:buster

RUN apt-get update
RUN apt-get -y upgrade

# Install Apache2 / Perl.
RUN apt-get -y install \
apache2 perl perl-modules libapache2-mod-perl2 \
libcgi-pm-perl libdbi-perl build-essential nano \
curl libaio1 cpanminus alien wget libexpat1-dev \
gettext-base libssl-dev libz-dev

# Install the Oracle Instant Client
RUN wget -P /tmp \
https://download.oracle.com/otn_software/linux/instantclient/oracle-instantclient-basic-linuxx64.rpm \
https://download.oracle.com/otn_software/linux/instantclient/oracle-instantclient-devel-linuxx64.rpm \
https://download.oracle.com/otn_software/linux/instantclient/oracle-instantclient-sqlplus-linuxx64.rpm
RUN alien -i --scripts \
/tmp/oracle-instantclient-basic-linuxx64.rpm \
/tmp/oracle-instantclient-devel-linuxx64.rpm \
/tmp/oracle-instantclient-sqlplus-linuxx64.rpm \
&& rm -rf /tmp/oracle-instantclient-*-linuxx64.rpm

ENV PERL5LIB=/var/www/html/pl

# Perl modules
RUN cpanm -n \
DBD::Oracle \
JSON::XS \
URI::Escape \
Data::UUID \
Log::Log4perl \
DBIx::Log4perl \
Text::CSV \
HTML::TreeBuilder \
Digest::SHA1 \
Archive::Zip \
IO::String \
XML::TreePP \
Text::Unidecode \
XML::Twig \
File::Slurp \
Excel::Writer::XLSX \
Crypt::JWT \
Mojo::UserAgent \
IO::Socket::SSL

# Enable Apache2 modules
RUN a2enmod rewrite

# Set up the Apache2 environment variables
ENV APACHE_RUN_USER=www-data \
APACHE_RUN_GROUP=www-data \
APACHE_LOG_DIR=/var/log/apache2 \
APACHE_LOCK_DIR=/var/lock/apache2 \
APACHE_PID_FILE=/var/run/apache2.pid \
PERL5LIB=/var/www/html/pl

# Set up the Apache configuration
COPY 000-default.conf /etc/apache2/sites-available/000-default.conf
RUN ln -sf /etc/apache2/mods-available/cgi.load /etc/apache2/mods-enabled/
RUN ln -sf /etc/apache2/mods-available/ssl.load /etc/apache2/mods-enabled/
RUN rm /etc/apache2/mods-enabled/deflate.*

#USER www-data
EXPOSE 80

COPY pl /var/www/html/pl
COPY pl/grip.pm /usr/local/share/perl/5.28.1/

#Run Apache2 in Foreground
CMD apachectl -DFOREGROUND
