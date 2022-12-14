import type { AWS } from "@serverless/typescript";

const serverlessConfiguration: AWS = {
  useDotenv: true,
  service: "certificateignite",
  frameworkVersion: "3",
  plugins: [
    "serverless-esbuild",
    "serverless-dynamodb-local",
    "serverless-offline",
  ],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    region: "us-east-1",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    logs: {
      restApi: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      TABLE_NAME: "${env:TABLE_NAME}",
      EMAIL_REMETENTE: "${env:EMAIL_REMETENTE}",
      NOME_BUCKET: "${env:NOME_BUCKET}",
    },
    iam: {
      role: {
        statements: [
          { Effect: "Allow", Action: ["dynamodb:*"], Resource: ["*"] },
          { Effect: "Allow", Action: ["s3:*"], Resource: ["*"] },
          {
            Effect: "Allow",
            Action: ["ses:SendEmail", "ses:SendRawEmail"],
            Resource: "*",
          },
        ],
      },
    },
  },
  package: { individually: false, include: ["./src/templates/**"] },
  functions: {
    generateCertificate: {
      timeout: 15,
      handler: "src/functions/generateCertificate.handler",
      events: [
        {
          http: {
            path: "generateCertificate",
            method: "post",
            cors: true,
          },
        },
      ],
    },
    generateCertificateVisualization: {
      timeout: 15,
      handler: "src/functions/generateCertificateVisualization.handler",
      events: [
        {
          http: {
            path: "generateCertificateVisualization",
            method: "post",
            cors: true,
          },
        },
      ],
    },
    validateCertificate: {
      handler: "src/functions/validateCertificate.handler",
      events: [
        {
          http: {
            path: "validateCertificate/{id}",
            method: "get",
            cors: true,
          },
        },
      ],
    },
    sendEmailCertificate: {
      handler: "src/functions/sendEmailCertificate.handler",
      events: [
        {
          http: {
            path: "sendEmailCertificate",
            method: "post",
            cors: true,
          },
        },
      ],
    },
    sendEmailTrigedByS3: {
      handler: "src/functions/sendEmailTrigedByS3.handler",
      events: [
        {
          s3: {
            bucket: "bucket-certificate-ignite-serverless-rocketseat",
            event: "s3:ObjectCreated:*",
            rules: [
              {
                suffix: ".pdf",
              },
            ],
            existing: true,
          },
        },
      ],
    },
  },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node14",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
      external: ["chrome-aws-lambda"],
    },
    dynamodb: {
      stages: ["dev", "local"],
      start: {
        inMemory: true,
        migrate: true,
        port: 8000,
      },
    },
  },
  resources: {
    Resources: {
      dbCertificateUsers: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "${env:TABLE_NAME}",
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            },
          ],
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
