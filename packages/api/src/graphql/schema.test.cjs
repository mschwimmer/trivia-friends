const { readFileSync } = require('node:fs');
const { buildSchema, graphql } = require('graphql');

describe('GraphQL schema', () => {
  it('serves the foundation health query', async () => {
    const typeDefs = readFileSync(
      new URL('./schema.graphql', `file://${__filename}`),
      'utf8'
    );
    const schema = buildSchema(typeDefs);

    const result = await graphql({
      schema,
      source: '{ health }',
      rootValue: {
        health: () => 'ok',
      },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ health: 'ok' });
  });

  it('does not expose private provider identity fields', () => {
    const typeDefs = readFileSync(
      new URL('./schema.graphql', `file://${__filename}`),
      'utf8'
    );
    const schema = buildSchema(typeDefs);
    const userFields = schema.getType('User').getFields();

    expect(userFields.email).toBeUndefined();
    expect(userFields.providerUid).toBeUndefined();
    expect(userFields.authProvider).toBeUndefined();
  });
});
