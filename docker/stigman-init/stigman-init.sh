#!/bin/bash

ask() {
    # https://djm.me/ask
    local prompt default reply

    if [ "${2:-}" = "Y" ]; then
        prompt="Y/n"
        default=Y
    elif [ "${2:-}" = "N" ]; then
        prompt="y/N"
        default=N
    else
        prompt="y/n"
        default=
    fi

    while true; do

        # Ask the question (not using "read -p" as it uses stderr not stdout)
        echo -n "$1 [$prompt] "

        # Read the answer (use /dev/tty in case stdin is redirected from somewhere else)
        read reply </dev/tty

        # Default?
        if [ -z "$reply" ]; then
            reply=$default
        fi

        # Check if the reply is valid
        case "$reply" in
            Y*|y*) return 0 ;;
            N*|n*) return 1 ;;
        esac

    done
}

if ask "Create STIG Manager schemas?" Y; then
    docker exec -it docker_db_1 bash -l -c "sqlplus sys/Oradoc_db1 as sysdba @/stigman-init/db/inits.sql; exit"
    echo -e "\nFinsihed attempt to create schemas.\n"
fi

if ask "Import demonstration data?" Y; then
    docker exec -it docker_db_1 bash -l -c "sqlplus sys/Oradoc_db1 as sysdba @/stigman-init/db/demo-data.sql; exit"
    echo -e "\nFinished attempt to import demonstration data.\n"
fi

if ask "Download the current STIG Library Compilation [~215MB] to ./stigs?" Y; then
    wget -P ./stigs "https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/U_SRG-STIG_Library_2020_01v4.zip"
    echo -e "\nFinished attempt to download STIGs.\n"
fi

if ask "Import the contents of ./stigs [might take several minutes]?" Y; then
    docker exec -it docker_web_1 bash -l -c "./stigman-init/stigs/importStigs.pl /stigman-init/stigs; exit;"
    echo -e "\nFinished attempt to import STIGs.\n"
fi

echo -e "\nFinished attempt to initialize demonstration STIG Manager.\n"
