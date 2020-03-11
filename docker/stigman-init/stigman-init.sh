
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
    #sqlplus sys/Oradoc_db1@$SM_ORACLE_HOST/orclcdb.localdomain as sysdba  @/stigman-init/db/inits.sql
    sqlplus sys/Oradoc_db1@db/orclcdb.localdomain as sysdba @/stigman-init/db/inits.sql
    echo -e "\nFinsihed attempt to create schemas.\n"
fi

if ask "Import demonstration data?" Y; then
    sqlplus sys/Oradoc_db1@db/orclcdb.localdomain as sysdba @/stigman-init/db/demo-data.sql
    echo -e "\nFinished attempt to import demonstration data.\n"
fi

if ask "Download the current STIG Library Compilation [~215MB] to ./stigs?" Y; then
    echo "Retreiving list of Compilation files from public.cyber.mil..."
    files=$(curl -s "https://public.cyber.mil/stigs/compilations/" | \
    sed -n 's/.*<a href=\"\(https:\/\/dl.dod.cyber.mil\/wp-content\/uploads\/stigs\/zip\/.*\)\" target=.*$/\1/p')
    while IFS= read -r line ; do wget -nc -P /stigman-init/stigs $line; done <<< "$files"
    echo -e "\nFinished attempt to download STIG Library Compilation.\n"
fi

if ask "Download the current SCAP Benchmarks to ./stigs?" Y; then
    echo "Retreiving list of SCAP files from public.cyber.mil..."
    files=$(curl -s "https://public.cyber.mil/stigs/scap/" | \
    sed -n 's/.*<a href=\"\(https:\/\/dl.dod.cyber.mil\/wp-content\/uploads\/stigs\/zip\/.*\)\" target=.*$/\1/p')
    while IFS= read -r line ; do wget -nc -P /stigman-init/stigs $line; done <<< "$files"
    echo -e "\nFinished attempt to download current SCAP content.\n"
fi

if ask "Import the contents of ./stigs [might take several minutes]?" Y; then
    ./stigman-init/stigs/importStigs.pl --scap /stigman-init/stigs
    echo -e "\nFinished attempt to import STIGs.\n"
fi

echo -e "\nFinished attempt to initialize demonstration STIG Manager.\n"
