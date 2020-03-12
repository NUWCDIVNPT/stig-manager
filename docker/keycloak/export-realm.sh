docker exec -it cmsat_auth_1 keycloak/bin/standalone.sh \
-Djboss.socket.binding.port-offset=100 \
-Dkeycloak.migration.action=export \
-Dkeycloak.migration.provider=singleFile \
-Dkeycloak.migration.realmName=stigman \
-Dkeycloak.migration.usersExportStrategy=REALM_FILE \
-Dkeycloak.migration.file=/tmp/my_realm.json

docker cp cmsat_auth_1:/tmp/my_realm.json .

