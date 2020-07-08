This is a full stack web app to demonstrate using GraphQL using Typescript.

One caveat here is that I was hoping to use local resolvers in the client, but React does not allow for calling the useQuery hook outside of a React component, so I needed to add logic inside the component to call useQuery there and also manage local state there.

To launch the server:
docker-compose up

To populate the database:
sh dynamo.sh

To start the client:
npm start

Enjoy!!
