# jwt-auth

This is a boilerplate repository that provides a simple JWT authentication REST service written in JavaScript. The service provides signup and signin functionality, but does not have a logout route (all token expire in 1 hour) and does not provide user management endpoints.

The service assumes that you will be connecting to a MongoDB database.

## API endpoint

- POST `/api/auth/signup`
  Request parameters:
  ```
  {
      username: 'String',
      email: 'String', // must be a valid email
      password: 'String',
      roles: 'Array' // an array of user roles. The service currently assumes only 'admin' and 'user' as inputs, and defaults to 'user' when the parameter is not passed
  }
  ```
- POST `/api/auth/singin`
  Request parameters:
  ```
  {
      username: 'String',
      password: 'String'
  }
  ```

## Development

- Copy .env.example to a new .env file in the project root and fill in the values.
- `npm run test:watch` starts the test suite in watch mode
- `npm run test` runs the test suite once
- `npm run develop` runs the service locally using nodemon to refresh with changes
