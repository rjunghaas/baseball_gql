const Nightmare = require('nightmare');
const nightmare = Nightmare({ show:false });

// From: https://github.com/rosshinkley/nightmare-examples/blob/master/docs/beginner/action.md
// Function for parsing text from selection
Nightmare.action('textExtract', function(selector: string, done: Function) {
  //`this` is the Nightmare instance
  nightmare.evaluate_now((selector: string) => {
    //query the document for all elements that match `selector`
    //note that `document.querySelectorAll` returns a DOM list, not an array
    //as such, convert the result to an Array with `Array.from`
    //return the array result
    return Array.from(document.querySelectorAll(selector))
      //extract and return the text for each element matched
      .map((element: any) => element.innerText);
  //pass done as the first argument, other arguments following
  }, done, selector)
});

// Helper function to convert an array of strings into a number array
const convertStrArrToNum = (arr: string[]): number[] => {
  return (arr.map(item => Number(item)));
}

// Uses Nightmare to pull player's data over date range and wraps relevant stats
// in an array to be processed later
const getPlayerData = async (playerId: string, startDate: string, endDate: string): Promise<number[]> => {
    let encodedStartDate: string = encodeURIComponent(startDate);
    let encodedEndDate: string = encodeURIComponent(endDate);
    let totalsUrl: string = 'https://www.baseballmusings.com/cgi-bin/PlayerInfo.py?StartDate=' + encodedStartDate + '&EndDate=' + encodedEndDate + '&GameType=all&PlayedFor=0&PlayedVs=0&Park=0&PlayerID=' + playerId;
    let totalsRow = await nightmare.goto(totalsUrl)
      .textExtract('tr[class="toprow"]')
      .then((result: string[]) => {
        let row: string[] = result[result.length-2].split('\t');
        let games: string = row[1].split(' ')[0];
        let restOfRow: string[] = row.slice(2, );
        let totalsRow: string[] = [games].concat(restOfRow);
        return convertStrArrToNum(totalsRow);
      });

    let summaryUrl = 'https://www.baseballmusings.com/cgi-bin/PlayerInfo.py?StartDate=' + encodedStartDate + '&EndDate=' + encodedEndDate + '&GameType=all&PlayedFor=0&PlayedVs=0&Park=0&PlayerID=' + playerId;
    let summaryRow = await nightmare.goto(summaryUrl)
      .textExtract('td[class="number"]')
      .then((result: string[]) => {
        let row: string[] = result.slice(result.length-7, result.length-1);
        return convertStrArrToNum(row);
      });

    let retArr: number[] = [totalsRow[0], totalsRow[2], totalsRow[3], totalsRow[4], totalsRow[5], totalsRow[6], totalsRow[7], totalsRow[8], totalsRow[9] + totalsRow[10], totalsRow[11], totalsRow[14], totalsRow[15], totalsRow[16], totalsRow[17], summaryRow[0], summaryRow[1], summaryRow[2], summaryRow[1] + summaryRow[2]];
    return retArr;
}

// Takes stats array and calculates VORP
const calcVorp = (statsArray: number[]): string => {
  // constants
  let lgBA = 0.253;
  let lgOBP = 0.317;
  let lgSLG = 0.396;
  let lgRunsPerOut = 0.1633;
  let replaceR = 0.8;

  let replaceRadical = (25 * lgOBP * lgSLG) / (1 - lgBA);
  let replaceRoot = Math.pow(replaceRadical, (1/3.0));
  let replaceP = (0.1073 - (0.11 * replaceR)) * replaceRoot;

  let ab = statsArray[1];
  let hits = statsArray[3];
  let cs = statsArray[10];
  let sh = statsArray[11];
  let sf = statsArray[12];
  let gdp = statsArray[13];

  let totalOuts = ab - hits + cs + sf + sf + gdp;
  let totalSeasons = (statsArray[0] / 162);
  let adjustedOuts = (totalOuts / totalSeasons);
  let runsProduced = (lgRunsPerOut * adjustedOuts);
  let replaceRunsProduced = (replaceR * runsProduced);

  let walks = statsArray[8];
  let hbp = statsArray[9];
  let doubles = statsArray[4];
  let triples = statsArray[5];
  let homeRuns = statsArray[6];

  let totalBases = hits + doubles + (2 * triples) + (3 * homeRuns) + walks + hbp;
  let runsCreated = ((hits + walks) * totalBases) / (ab + walks);
  let adjustedRunsCreated = (runsCreated / totalSeasons);

  let vorp: number = (adjustedRunsCreated - replaceRunsProduced);
  return vorp.toFixed(2);
}

// Async function to handle requests from API by calling getPlayerData, then
// processing results with calcVorp
export async function getVorp(playerId: string, startDate: string, endDate: string): Promise<string> {
  return(await getPlayerData(playerId, startDate, endDate)
    .then((res) => {
      console.log("Calculating Vorp");
      return(calcVorp(res));
    }));
}
