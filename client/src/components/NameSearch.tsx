import React from "react";
import { gql } from 'apollo-boost';
import { useLazyQuery, useApolloClient } from '@apollo/react-hooks';

// GQL query that is run to match searchStr to closest player name
const PLAYER_QUERY = gql`
  query PlayerId($searchStr: String!){
    getPlayer(searchStr: $searchStr){
      searchStr
      name
      playerId
    }
  }
`;

// NameSearch function for taking text entered and searching for closest player
// whose name matches the text
function NameSearch(): any {
  // Initialize ApolloClient so we can get access to ApolloProvider's cache
  const client = useApolloClient();
  let cache = client.cache;

  // Instantiate a query function that we can trigger to get player's name
  const [getPlayer, { error, data }] = useLazyQuery(PLAYER_QUERY);

  // Helper function for querying the closest player's name to searchStr, then
  // stores the resulting name and ID in the cache.
  // I initially wanted to use a client-side resolver, but you cannot call the
  // useQuery hook outside of the React component
  function updatePlayer(searchStr:string) {
    // Trigger the query to get closest match to searchStr
    getPlayer({variables: {searchStr: searchStr}});

    // handle error state
    if (error) {
      console.warn(error);
      return (<div>`Error! ${error.message}`</div>);
    }

    // If there is a result from the query, store it in cache
    if(data){
      cache.writeData({
        data: {
          __typename: 'Player',
          searchStr: searchStr,
          playerId: data.getPlayer.playerId,
          name: data.getPlayer.name
        }
      });
    }

    return null;
  };

  // Render JSX element and insert data
  // Trigger helper function when the value of input box is changed
  return (
    <div>
      <input type="text" placeholder="Enter Player's Name" value={data ? data.getPlayer.searchStr : ''} onChange={e => {e.preventDefault(); updatePlayer(e.target.value)}}/>
      <br/>
      <h3>{data ? data.getPlayer.name : ''}</h3>
    </div>
  )
};

export default NameSearch;
