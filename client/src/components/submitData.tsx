import React from "react";
import { gql } from 'apollo-boost';
import { useLazyQuery, useApolloClient } from '@apollo/react-hooks';

// GQL query to get player data from cache which will be passed to a remote query
const ID_QUERY = gql`
  {
    playerId @client
    startDate @client
    endDate @client
  }
`;

// Remote query to calculate player's VORP given their ID as well as
// the start and end date of the calculation
const VORP_QUERY = gql`
  query PlayerVorp($playerId: Int!, $startDate: String!, $endDate: String!){
    getPlayerVorp(playerId: $playerId, startDate: $startDate, endDate: $endDate)
    {
      vorp
    }
  }
`;

// helper function to validate string is in proper date format
function validateDate(testdate: string) {
    var date_regex = /^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/ ;
    return date_regex.test(testdate);
}

// React component which consists of date fields for start and end dates as well
// as submit button to trigger VORP calculation
const SubmitSearch = (): any => {
  // connect to our client so that we can access cache
  const client = useApolloClient();
  let cache = client.cache;

  // Create a function that we can use to trigger our query to server for
  // calculating VORP
  const [calcPlayerVorp, { error, data }] = useLazyQuery(VORP_QUERY);

  // Helper function to set start and end Date values in cache
  function setDate(dateType:string, dateValue:string) {
    // Ensure we first have a valid date.  If so, set it in cache
    if(validateDate(dateValue)){
      if(dateType === 'start') {
        cache.writeData({
          data: {
            startDate: dateValue
          }
        })
      }
      else if (dateType === 'end') {
          cache.writeData({
            data: {
              endDate: dateValue
            }
          })
      }
    }
    return null;
  }

  // Helper function to send parameters to server to calculate VORP
  function getVorp():void {
    // Fetch playerId, start, and end dates from cache and assign to local variables
    let d:any = cache.readQuery({query: ID_QUERY});
    let currPlayerId = d.playerId;
    let currStartDate = d.startDate;
    let currEndDate = d.endDate

    // Pass in values from cache and trigger our VORP function
    calcPlayerVorp({
      variables: {
        playerId: currPlayerId,
        startDate: currStartDate,
        endDate: currEndDate
      }
    });

    // Handle errors
    if (error) {
      console.warn(error);
    }
    return;
  };

  // Render component, connect date fields to relevant cache field,
  // and set onclick for submit button to relevant function.
  // Show rounded value of vorp property
  return (
    <div>
        <div> <h4>Start Date for Player:</h4> <br /> </div>
        <div> <input type="text" placeholder="MM/DD/YYYY" onChange={e => setDate('start', e.target.value)}/></div>
        <div> <h4>End Date for Player: </h4><br /></div>
        <div> <input type="text" placeholder="MM/DD/YYYY" onChange={e => setDate('end', e.target.value)}/></div>
        <div><input type="submit" value="Submit" name="submit" onClick={() => getVorp()}/></div>
        <br />
        <div><h3>VORP: { data ? data.getPlayerVorp.vorp : '' }</h3></div>
    </div>
  )
}

export default SubmitSearch;
