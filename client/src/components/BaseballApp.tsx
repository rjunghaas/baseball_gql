import React from 'react';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from '@apollo/react-hooks';
import { InMemoryCache } from 'apollo-cache-inmemory';
import NameSearch from './NameSearch';
import SubmitSearch from './submitData';
import '../application.css'
declare let module: any;

// Instantiate cache
// Set the index of cache as __typename field
let cache = new InMemoryCache({
  dataIdFromObject: object => object.__typename || 'Player'
});

// Instantiate ApolloClient with cache and URI for the server
const client = new ApolloClient({
  uri: 'URL_HERE',
  cache: cache,
});

// Initialize cache data
cache.writeData({
  data: {
    __typename: 'Player',
    searchStr: '',
    name: '',
    playerId: 13110,
    startDate: '01/01/2000',
    endDate: '12/31/2020',
  },
});

// main component
function BaseballApp(): any {
  return (
    <ApolloProvider client={client}>
      <div className="app">
        <NameSearch />
        <br />
        <SubmitSearch />
        </div>
    </ApolloProvider>
  );
}

// add hot updates
if(module.hot){
  module.hot.accept();
}

export default BaseballApp
