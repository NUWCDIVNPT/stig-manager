#!/bin/bash

usage() {
  echo "Usage: $0 [-p pattern ...] [-f file ...] [-d directory ...] [-i iteration name ...]"
  echo "  -b bail        Stop running tests after the first failure."
  echo "  -c coverage    Run all tests with a response validation log and generate coverage report. (cannot be used with other options)"
  echo "  -d directory   Run tests in specific directory."
  echo "  -f file        Run specific test file."
  echo "  -i iteration   Run tests for specific iteration.name (see iterations.js)"
  echo "  -p pattern     Run tests matching the whole word."
  echo "  -s mode        Saves metrics reference data files during tests."
  echo "                 Use '-s new' to create new files with 'new-' prefix."
  echo "                 Use '-s update' to modify existing files."
  echo -e "  -h help        examples: \n ./runMocha.sh \n ./runMocha.sh -p \"the name of my test\" \n ./runMocha.sh -p \"getCollections|getAsset\" \n ./runMocha.sh -p getCollections \n ./runMocha.sh -i lvl1 -i lvl2 -p getCollections \n ./runMocha.sh -f collectionGet.test.js \n ./runMocha.sh -d mocha/data/collection"
  exit 
}

DEFAULT_COMMAND="npx mocha --reporter mochawesome --no-timeouts --showFailed --exit"
COMMAND=$DEFAULT_COMMAND
COVERAGE=false
SAVE_METRICS=false
METRICS_MODE="new"  # by default -s generates new metrics reference data files
GREP=()
FILES=()
DIRECTORIES=()
ITERATION=()

while getopts "bcd:f:s:hi:p:" opt; do
  case ${opt} in
    b) COMMAND+=" --bail" ;;
    c) COVERAGE=true ;;
    d) DIRECTORIES+=("${OPTARG}") ;;
    f) FILES+=("./mocha/**/${OPTARG}") ;;
    h) usage ;;
    i) ITERATION+=("${OPTARG}") ;;
    p) GREP+=("${OPTARG}") ;;
    s) 
       SAVE_METRICS=true
       # Check if the argument starts with a dash, which means it's likely another option
       if [[ "$OPTARG" == -* ]]; then
         echo "Error: Option -s requires an argument (new or update)."
         echo "Did you mean '-s new -f metaMetricsGet.test.js'?"
         usage
       fi
       METRICS_MODE="$OPTARG"
       ;;    
    *) usage ;;
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

if [ ${#GREP[@]} -gt 0 ] || [ ${#ITERATION[@]} -gt 0 ]; then
  GREP_STRING=$(IFS='|'; echo "${GREP[*]}")
  ITERATION_PATTERN=$(IFS='|'; echo "${ITERATION[*]}")
  GREP_PATTERN="${ITERATION_PATTERN:+\\biteration:(${ITERATION_PATTERN})\\b}${GREP:+.*\\b(${GREP})\\b}"
  COMMAND+=" -g \"/$GREP_PATTERN/\""
fi

# Set environment variables for metrics generation
if $SAVE_METRICS; then
  export STIGMAN_SAVE_METRICS_DATA=true
  
  # Set the appropriate mode based on the -s argument
  if [ "$METRICS_MODE" = "update" ]; then
    export STIGMAN_NEW_METRICS_FILES=false
    echo "Updating existing metrics reference data files..."
  else
    export STIGMAN_NEW_METRICS_FILES=true
    echo "Generating new metrics reference data files with 'new-' prefix..."
  fi
else
  export STIGMAN_SAVE_METRICS_DATA=false
  export STIGMAN_NEW_METRICS_FILES=false
fi

validate_responses() {
  local LOG_FILE="./api/source/api-log.json"
  local VALIDATION_FILE="./api/source/response-validation-errors.json"

  if [ -f "$LOG_FILE" ]; then
    echo "Running response validation..."
    jq -s 'map(select(.type=="responseValidation")|{method:.data.request.method,url:.data.request.url,errors:.data.error.errors,body:.data.body})' <(grep -E '^\{.*\}$' "$LOG_FILE") > "$VALIDATION_FILE"
    local VALIDATION_COUNT=$(jq '. | length' "$VALIDATION_FILE")
    echo "Validation complete. Output in $VALIDATION_FILE."
  else
    echo "Error: API log file not found."
    return 1
  fi
}

coverage() {
  SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
  API_DIR="$SCRIPT_DIR/../../api/source"
  PROJECT_DIR="$SCRIPT_DIR/../.."
  COVERAGE_DIR="$SCRIPT_DIR/coverage"
  
  export STIGMAN_API_PORT=${STIGMAN_API_PORT:-64001}
  export STIGMAN_DB_HOST=${STIGMAN_DB_HOST:-localhost}
  export STIGMAN_DB_PORT=${STIGMAN_DB_PORT:-50001}
  export STIGMAN_DB_PASSWORD=${STIGMAN_DB_PASSWORD:-stigman}
  export STIGMAN_API_AUTHORITY=${STIGMAN_API_AUTHORITY:-"http://127.0.0.1:8080/realms/stigman"}
  export STIGMAN_EXPERIMENTAL_APPDATA=${STIGMAN_EXPERIMENTAL_APPDATA:-true}
  export STIGMAN_DEV_RESPONSE_VALIDATION="logOnly"
  export STIGMAN_DEV_ALLOW_INSECURE_TOKENS="true"
  export NODE_V8_COVERAGE="$COVERAGE_DIR"

  mkdir -p "$NODE_V8_COVERAGE"
  cd "$PROJECT_DIR"

  echo "Make sure stigmanager api is not already running... will end any existing api process."
  kill -9 $(lsof -t -i:${STIGMAN_API_PORT:-64001}) 2>/dev/null || echo "No existing API process found."
  c8 --reporter=html --reporter=text --reporter=lcov node -e "
    const { spawn } = require('child_process')
    const fs = require('fs')

     const logStream = fs.createWriteStream('./api/source/api-log.json', { flags: 'w' })
    
    console.log('Starting the API...')
    const server = spawn('node', ['./api/source/index.js'], { stdio: 'pipe'})

    server.stdout.pipe(logStream)
    server.stderr.pipe(logStream)

    // Wait for the API to start
    setTimeout(() => {
      console.log('Running Mocha tests...')
      const tests = spawn('mocha', ['./test/api/mocha/**/*.test.js', '--no-timeouts', '--ignore', '*/**/node_modules/**/*', '--recursive', '--ignore', './node_modules/**'], { stdio: 'inherit'})

      tests.on('close', (code) => {
        console.log('Tests finished. Stopping server...')
        server.kill()
        logStream.end()
        process.exit(code)
      });
    }, 5000);
  "

  c8 report -r lcov -r text -r html --report-dir "$COVERAGE_DIR"
  echo "Coverage report is available at $COVERAGE_DIR"
}

if $COVERAGE; then
  coverage
  validate_responses
else
  echo "Running command: $COMMAND"
  eval $COMMAND
fi
