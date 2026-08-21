## Run Command

cd /home/mobin/Documents/mobinshaterian.com/src/data/kg

export OPENAI_BASE_URL="https://api.avalai.ir/v1"
export OPENAI_API_BASE="https://api.avalai.ir/v1"
export OPENAI_API_KEY="aa-3mXXXXX"

# Load .env into the current subs hell and run graphify
env $(cat .env | xargs) graphify extract ./md --backend openai --model gpt-5.6-luna


## Human readable

cd /home/mobin/Documents/mobinshaterian.com/src/data/kg

env $(cat .env | xargs) graphify cluster-only ./md --backend openai --model gpt-5.6-luna

## Query 

cd /home/mobin/Documents/mobinshaterian.com/src/data/kg/md

# Find relationships connected to a specific technology
graphify query "ClickHouse"
graphify query "Kafka"


# Find relationships connected to a specific technology and return the results in a human-readable format

python3 graph_rag.py