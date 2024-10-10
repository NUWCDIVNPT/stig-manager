
#!/bin/bash

usage() {
  echo "Usage: $0 [-p pattern ...] [-f file ...] [-d directory ...] [-i iteration name ...]"
  echo "  -p pattern     Run tests matching the whole word."
  echo "  -f file        Run specific test file."
  echo "  -d directory   Run tests in specific directory."
  echo "  -i iteration   Run tests for specific iteration.name (see iterations.js)" 
  echo -e "  -h help        examples: \n ./runMocha.sh \n ./runMocha.sh -p \"the name of my test\" \n ./runMocha.sh -p \"getCollections|getAsset\" \n ./runMocha.sh -p getCollections \n ./runMocha.sh -i lvl1 -i lvl2 -p getCollections \n ./runMocha.sh -f collectionGet.test.js \n ./runMocha.sh -d mocha/data/collection"
  exit 
}

DEFAULT_COMMAND="npx mocha --reporter mochawesome --no-timeouts --showFailed --exit './mocha/**/*.test.js'"
COMMAND="npx mocha --reporter mochawesome --no-timeouts --showFailed --exit"

PATTERNS=()
FILES=()
DIRECTORIES=()
USERS=()

while getopts "p:f:d:i:h:" opt; do
  case ${opt} in
    p)
      PATTERNS+=("${OPTARG}")
      ;;
    f)
      FILES+=("./mocha/**/${OPTARG}")
      ;;
    d)
      DIRECTORIES+=("${OPTARG}")
      ;;
    i)
      USERS+=("${OPTARG}")
      ;;
    h)
      usage
      ;;
    *)
      usage
      ;;
  esac
done

if [ ${#FILES[@]} -gt 0 ] && [ ${#DIRECTORIES[@]} -gt 0 ]; then
  echo "Error: You can specify either files or directories, but not both."
  usage
fi

if [ ${#DIRECTORIES[@]} -gt 0 ]; then
  COMMAND+=" ${DIRECTORIES[*]}"
elif [ ${#FILES[@]} -gt 0 ]; then
  COMMAND+=" ${FILES[*]}"
else
  COMMAND+=" './mocha/**/*.test.js'"
fi

GREP_PATTERN=""
if [ ${#USERS[@]} -gt 0 ]; then
  USER_PATTERN=$(IFS='|'; echo "${USERS[*]}")
  GREP_PATTERN="\\biteration:(${USER_PATTERN})\\b"
fi

if [ ${#PATTERNS[@]} -gt 0 ]; then
  PATTERN_STRING=$(IFS='|'; echo "${PATTERNS[*]}")
  GREP_PATTERN="${GREP_PATTERN:+$GREP_PATTERN.*}\\b(${PATTERN_STRING})\\b"
fi

if [ -n "$GREP_PATTERN" ]; then
  COMMAND+=" -g \"/$GREP_PATTERN/\""
fi

if [ ${#PATTERNS[@]} -eq 0 ] && [ ${#FILES[@]} -eq 0 ] && [ ${#DIRECTORIES[@]} -eq 0 ] && [ ${#USERS[@]} -eq 0 ]; then
  COMMAND="$DEFAULT_COMMAND"
fi

echo "Running command: $COMMAND"
eval $COMMAND
