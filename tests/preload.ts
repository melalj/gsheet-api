// Mock GOOGLE_CREDENTIALS before any test imports
const mockCredentials = {
  client_email: 'test@test.iam.gserviceaccount.com',
  private_key: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF8PbnGy0ARL00L8LYfKk4vIoVPIx\nXyQqDx5B2WPzYVz1xJRYaYRLuPLR/0McPwPnDsFqbHGMY8f5b8TAESGsWCM+WaOz\nSamUOBlMlZIrLz7sDAHb0J+a0JXLRhLciJG1+bMqL/daVCdS3VyQ3WFv3zmE5sHw\nnBsNqpMDMgZnNk0Q7h7M+xKdF+sRQLusdyJqS3sWBL1gBNwml9eTOE8J2kVl2i+P\ny0J8J4JE7ChPpJ8GwmM3vCYHB8c3eM/xBBpZkZsCYJLJlXkV9S//3qL0J5hJ9Jxr\n1f1J9f1J9f1J9f1J9f1J9f1J9f1J9f1J9f1JwIDAQABAoIBAGhZhFhpBEw7NU+N\ntest_key_for_testing_purposes_only\n-----END RSA PRIVATE KEY-----',
};
process.env.GOOGLE_CREDENTIALS = Buffer.from(JSON.stringify(mockCredentials)).toString('base64');
