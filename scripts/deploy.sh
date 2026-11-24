#!/usr/bin/env bash
# Publica o front no S3 + CloudFront da conta do Prumo.
#
# Uso:
#   BUCKET=prumo-dev-app-444331926746 DISTRIBUTION_ID=E123ABC scripts/deploy.sh
#
# Os valores saem de `terragrunt output` na unidade dev/web do tf-environments.
# O build usa o .env.production (copie do .env.example e preencha).
set -euo pipefail

CONTA_PRUMO="444331926746"
PERFIL="${AWS_PROFILE_PRUMO:-prumo}"

: "${BUCKET:?Defina BUCKET (terragrunt output bucket_name)}"
: "${DISTRIBUTION_ID:?Defina DISTRIBUTION_ID (terragrunt output distribution_id)}"

cd "$(dirname "$0")/.."

if [[ ! -f .env.production ]]; then
  echo "Falta o .env.production (copie do .env.example e preencha)." >&2
  exit 1
fi

conta="$(aws sts get-caller-identity --profile "$PERFIL" --query Account --output text)"
if [[ "$conta" != "$CONTA_PRUMO" ]]; then
  echo "Conta errada: $conta (esperado $CONTA_PRUMO). Rode: aws login --profile $PERFIL" >&2
  exit 1
fi

npm ci
npm run build

# Arquivos com hash no nome: cache longo.
aws s3 sync dist/ "s3://$BUCKET/" --delete --profile "$PERFIL" \
  --exclude index.html \
  --cache-control "public, max-age=31536000, immutable"

# index.html: sempre revalidar, para a nova versão aparecer na hora.
aws s3 cp dist/index.html "s3://$BUCKET/index.html" --profile "$PERFIL" \
  --cache-control "no-cache" --content-type "text/html; charset=utf-8"

aws cloudfront create-invalidation --profile "$PERFIL" \
  --distribution-id "$DISTRIBUTION_ID" --paths "/index.html" "/" >/dev/null

echo "Publicado em s3://$BUCKET e cache do index.html invalidado."
