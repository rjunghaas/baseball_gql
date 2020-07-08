import { ApolloServer, gql } from 'apollo-server';
import AWS from 'aws-sdk';
import { aws_key_id, aws_secret } from './AwsKey';
import { getVorp } from './scraper';

// GraphQL schema definitions for Player, Vorp and Queries
const typeDefs = gql`
  type Player {
    searchStr: String
    name: String
    playerId: Int
  }

  type Vorp {
    vorp: Float
  }

  type Query {
    getPlayer(searchStr: String): Player
    getPlayerVorp(playerId: Int, startDate: String, endDate: String): Vorp
  }
`;

// Define type for getPlayer query to enforce string
type PlayerQueryParam = {
  searchStr: string;
};

// Define type for getPlayerVorp query to enforce types
type VorpQueryParam = {
  playerId: number;
  startDate: string;
  endDate: string;
}

// GraphQL resolver definitions
const resolvers = {
  Query: {
    // Resolver for matching searchStr to nearest player
    async getPlayer(_: Object, {searchStr}: PlayerQueryParam) {
      return await dynamoQuery(searchStr).then(retValue => {
        if (retValue != ["Error"]){
          return {searchStr: searchStr, name: retValue[0], playerId: parseInt(retValue[1])};
        } else {
          return {searchStr: searchStr, name: 'Yoenis Cespedes', playerId: 13110}
        }
      });
    },
    async getPlayerVorp(_: Object, { playerId, startDate, endDate }: VorpQueryParam) {
      return await getVorp(playerId.toString(), startDate, endDate).then(retValue => {
        return {vorp: retValue};
      });
    }
  }
}

// Initialize GraphQL server
const server = new ApolloServer({ cors: true, resolvers, typeDefs });

// Initialize DynamoDB
const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient({
  region: "us-west-2",
  endpoint: "http://192.168.1.67:8000",
  accessKeyId: aws_key_id,
  secretAccessKey: aws_secret
});

// Function to query DynamoDB asynchronously
const dynamoQuery = async (s: string): Promise<string[]> => {
  const defRes: string[] = ["Yoenis Cespedes", "13110"];
  try {
    let params = {
      TableName: 'PlayerId_Table',
      ProjectionExpression: 'nm, id',
      KeyConditionExpression: "p = :p and begins_with(nm, :nn)",
      ExpressionAttributeValues: {
        ":p": 1,
        ":nn": s
      }
    };

    // Wait for async response and return first response
    let response = await docClient.query(params).promise();
    if(response.Items){
      console.log("Found " + response.Items[0].nm);
      return [response.Items[0].nm, response.Items[0].id];
    } else {
        console.log("no results found");
        return defRes;
    }
  } catch (err) {
    console.log("Unable to query.  Error: ", JSON.stringify(err, null, 2));
    return ['Yoenis Cespedes', '13110'];
  }
}

// Start server
server.listen(5000).then( () => {
  console.log('Server ready');
})
