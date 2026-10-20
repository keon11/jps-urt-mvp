export const config = {
 port:Number(process.env.PORT || 3000),
 database:process.env.DATABASE_URL || 'postgres://ur:synthetic-local-only@localhost:5433/ur',
 medplum:process.env.MEDPLUM_URL || 'http://localhost:8103/',
 medplumClient:process.env.MEDPLUM_CLIENT_ID || '11111111-1111-4111-8111-111111111111',
 medplumSecret:process.env.MEDPLUM_CLIENT_SECRET || 'synthetic-service-local-only',
 cqf:process.env.CQF_URL || 'http://localhost:8080/fhir',
 keycloak:process.env.KEYCLOAK_URL || 'http://localhost:8081/realms/ur-demo',
 modelUrl:process.env.LOCAL_MODEL_URL || 'http://localhost:11434',
 model:process.env.LOCAL_MODEL_NAME || 'qwen2.5:0.5b',
};
