#!/bin/bash
set -e

# Definir valores padrão se as variáveis não estiverem definidas
MONGO_USERNAME=${MONGO_USERNAME:-xahau}
MONGO_PASSWORD=${MONGO_PASSWORD:-strongpassword}
MONGO_INITDB_DATABASE=${MONGO_INITDB_DATABASE:-xahau-docproof}

# Conectar e configurar o banco de dados
mongosh <<EOF
use ${MONGO_INITDB_DATABASE}
db.createUser({
  user: '${MONGO_USERNAME}',
  pwd: '${MONGO_PASSWORD}',
  roles: [
    { role: 'readWrite', db: '${MONGO_INITDB_DATABASE}' }
  ]
})
EOF